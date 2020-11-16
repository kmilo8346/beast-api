import Error from 'verror';
import axios, { AxiosInstance } from 'axios';

import utils from '../../../../beast/utils';
import config from '../../../../beast/config';
import { Place, AddressProp } from '../../../../types';

interface Prediction {
  description: string;
  place_id: string;
}

interface AutocompleteResponse {
  predictions: Prediction[];
}

class GeocodeClient {
  private request: AxiosInstance;

  constructor() {
    this.request = axios.create({
      baseURL: `${config.get('GOOGLE_MAPS_API_URL')}/geocode`,
      timeout: config.getNumber('GOOGLE_MAPS_API_REQUEST_TIMEOUT'),
    });
  }

  async geocode(address: string): Promise<Place[]> {
    try {
      const validStatus = ['OK', 'ZERO_RESULTS'];
      const response = await this.request.get('json', {
        params: {
          address,
          key: config.get('GOOGLE_API_KEY'),
          components: 'country:cl',
          language: 'es',
          fields: 'place_id,formatted_address,address_components,geometry',
        },
      });
      if (validStatus.indexOf(response.data.status) === -1) {
        throw new Error(
          { info: { response: response.data } },
          'Google geocode invalid status',
        );
      }
      return response.data.results.map(utils.mapPlace);
    } catch (error) {
      throw new Error({ cause: error, info: {} }, 'Error in geocode function');
    }
  }
}

export default new GeocodeClient();
