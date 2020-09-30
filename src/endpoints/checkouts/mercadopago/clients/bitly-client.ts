import Error from 'verror';
import axios, { AxiosInstance } from 'axios';

import config from '../../../../beast/config';

const prefix = '[bitly client]';

class BitlyClient {
  private request: AxiosInstance;

  constructor() {
    this.request = axios.create({
      baseURL: config.get('BITLY_API_URL'),
      timeout: config.getNumber('BITLY_API_TIMEOUT'),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.get('BITLY_API_TOKEN')}`,
      },
    });
  }

  /**
   * Shorten url
   * @param url
   */
  async shorten(url: string) {
    try {
      const { data } = await this.request.post('v4/shorten', {
        group_guid: config.get('BITLY_API_GROUP_GUID'),
        domain: 'bit.ly',
        long_url: url,
      });

      return data;
    } catch (error) {
      throw new Error(
        { cause: error, info: { url } },
        `${prefix} Unexpected error shortening url`,
      );
    }
  }
}

export default new BitlyClient();
