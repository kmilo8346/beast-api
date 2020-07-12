import Error from 'verror';
import axios, { AxiosInstance } from 'axios';

import config from '../../../../beast/config';

interface Prediction {
  description: string;
  place_id: string;
}

interface AutocompleteResponse {
  predictions: Prediction[];
}

interface AddressProp {
  short_name: string;
  long_name: string;
}

interface Place {
  id: string;
  url: string;
  street_number: AddressProp;
  route: AddressProp;
  locality: AddressProp;
  administrative_area_level_3: AddressProp;
  administrative_area_level_2: AddressProp;
  administrative_area_level_1: AddressProp;
  apartment: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    viewport: {
      northeast: {
        lat: number;
        lng: number;
      };
      southwest: {
        lat: number;
        lng: number;
      };
    };
  };
}

class PlacesClient {
  private request: AxiosInstance;

  constructor() {
    this.request = axios.create({
      baseURL: config.get('GOOGLE_PLACES_URL'),
      timeout: config.getNumber('GOOGLE_PLACES_REQUEST_TIMEOUT'),
    });
  }

  async autocomplete(
    input: string,
    sessiontoken: string,
  ): Promise<AutocompleteResponse> {
    try {
      const validStatus = ['OK', 'ZERO_RESULTS'];
      const response = await this.request.get('autocomplete/json', {
        params: {
          input,
          sessiontoken,
          key: config.get('GOOGLE_PLACES_API_KEY'),
          components: 'country:cl',
          types: 'address',
          language: 'es',
        },
      });
      if (validStatus.indexOf(response.data.status) === -1) {
        throw new Error(
          { info: { response: response.data } },
          'Google places autocomplete invalid status',
        );
      }
      return {
        predictions: response.data.predictions.map(
          (prediction: Prediction) => ({
            description: prediction.description,
            place_id: prediction.place_id,
          }),
        ),
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: { input, sessiontoken } },
        'Error getting google places autocomplete predictions',
      );
    }
  }

  async details(place_id: string, sessiontoken: string): Promise<Place> {
    try {
      const validStatus = ['OK', 'ZERO_RESULTS'];
      const response = await this.request.get('details/json', {
        params: {
          place_id,
          sessiontoken,
          key: config.get('GOOGLE_PLACES_API_KEY'),
          language: 'es',
          fields:
            'place_id,url,formatted_address,address_components,geometry,opening_hours',
        },
      });
      if (validStatus.indexOf(response.data.status) === -1) {
        throw new Error(
          { info: { response: response.data } },
          'Google places details invalid status',
        );
      }

      const types = [
        'street_number',
        'route',
        'locality',
        'administrative_area_level_3',
        'administrative_area_level_2',
        'administrative_area_level_1',
      ];
      const addressComponents: { [key: string]: AddressProp } = {};
      response.data.result.address_components.forEach(
        (component: {
          short_name: string;
          long_name: string;
          types: string[];
        }) => {
          component.types.forEach((type) => {
            const match = types.find((t) => t === type);
            if (match) {
              addressComponents[type] = {
                short_name: component.short_name,
                long_name: component.long_name,
              };
            }
          });
        },
      );
      return {
        id: response.data.result.place_id,
        url: response.data.result.url,
        street_number: addressComponents.street_number,
        route: addressComponents.route,
        locality: addressComponents.locality,
        administrative_area_level_3:
          addressComponents.administrative_area_level_3,
        administrative_area_level_2:
          addressComponents.administrative_area_level_2,
        administrative_area_level_1:
          addressComponents.administrative_area_level_1,
        apartment: '',
        geometry: response.data.result.geometry,
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: {} },
        'Error getting google places details',
      );
    }
  }
}

export default new PlacesClient();
