import Error from 'verror';
import axios, { AxiosInstance } from 'axios';

import { Place } from '../../../../types';
import utils from '../../../../beast/utils';
import config from '../../../../beast/config';

interface Prediction {
  description: string;
  place_id: string;
}

interface AutocompleteResponse {
  predictions: Prediction[];
}

class PlacesClient {
  private request: AxiosInstance;

  constructor() {
    this.request = axios.create({
      baseURL: `${config.get('GOOGLE_MAPS_API_URL')}/place`,
      timeout: config.getNumber('GOOGLE_MAPS_API_REQUEST_TIMEOUT'),
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
          key: config.get('GOOGLE_API_KEY'),
          components: 'country:cl',
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
          key: config.get('GOOGLE_API_KEY'),
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
      return utils.mapPlace(response.data.result);
    } catch (error) {
      throw new Error(
        { cause: error, info: {} },
        'Error getting google places details',
      );
    }
  }
}

export default new PlacesClient();
