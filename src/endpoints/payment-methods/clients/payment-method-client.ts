import Error from 'verror';

import mercadopago from '../../../beast/clients/mercadopago';
import { SearchParams } from '../../../types';
import utils from '../../../beast/utils';

const prefix = '[payment method client]';

class PaymentMethodClient {
  /**
   * Search payment methods using mercado pago /payment_methods/search
   * @param params SearchParams
   * @returns Promise<>
   */
  async search(params: SearchParams): Promise<any> {
    try {
      const response = await mercadopago.payment_methods.search(
        'active',
        params.filters?.bins,
      );
      return {
        total: response.paging.total,
        hits: utils.mapArray(response.results, params.source),
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: {} },
        `${prefix} Error searching payment methods`,
      );
    }
  }
}

export default new PaymentMethodClient();
