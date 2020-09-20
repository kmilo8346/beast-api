import Error from 'verror';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';

import config from '../../../../beast/config';
import { CreateParams } from '../../../../types';
import utils from '../../../../beast/utils';

const prefix = '[mercado pago oauth client]';

class OauthClient {
  private request: AxiosInstance;

  constructor() {
    this.request = axios.create({
      baseURL: `${config.get('MERCADO_PAGO_URL')}/oauth`,
      timeout: config.getNumber('MERCADO_PAGO_REQUEST_TIMEOUT'),
      headers: { Accept: 'application/json' },
    });
  }

  /**
   * Generating a mercado pago token using a authorization code
   * @param params
   */
  async token(params: CreateParams<{ code: string }>): Promise<any> {
    try {
      const form = new FormData();
      form.append('client_secret', config.get('MERCADO_PAGO_ACCESS_TOKEN'));
      form.append('grant_type', 'authorization_code');
      form.append('code', params.body.code);
      form.append(
        'redirect_uri',
        `${config.get('BEAST_REDIRECT')}/auth/mercadopago`,
      );

      const response = await this.request.post('token', form, {
        headers: form.getHeaders(),
      });

      return utils.mapObject(response.data, params.source);
    } catch (error) {
      throw new Error(
        { cause: error, info: { params } },
        `${prefix} Error creating mercado pago token`,
      );
    }
  }
}

export default new OauthClient();
