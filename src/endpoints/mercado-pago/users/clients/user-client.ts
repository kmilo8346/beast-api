import Error from 'verror';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';

import config from '../../../../beast/config';
import { CreateParams, GetParams } from '../../../../types';
import utils from '../../../../beast/utils';

const prefix = '[mercado pago user client]';

class UserClient {
  private request: AxiosInstance;

  constructor() {
    this.request = axios.create({
      baseURL: `${config.get('MERCADO_PAGO_API_URL')}/users`,
      timeout: config.getNumber('MERCADO_PAGO_API_REQUEST_TIMEOUT'),
      headers: { Accept: 'application/json' },
    });
  }

  /**
   * Get a mercado pago user
   * @param id
   * @param params
   */
  async get(id: string, params: GetParams): Promise<any> {
    try {
      const response = await this.request.get(id);

      return utils.mapObject(response.data, params.source);
    } catch (error) {
      throw new Error(
        { cause: error, info: { id, params } },
        `${prefix} Unexpected error getting mercado pago user`,
      );
    }
  }
}

export default new UserClient();
