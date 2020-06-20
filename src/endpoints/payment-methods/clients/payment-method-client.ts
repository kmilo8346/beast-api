import Error from 'verror';

import mercadopago from '../../../beast/clients/mercadopago';

class PaymentMethodClient {
  async search(params: { bins: string }): Promise<any> {
    try {
      const response = await mercadopago.payment_methods.search(
        'active',
        params.bins,
      );
      return {
        total: response.paging.total,
        hits: response.results,
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: {} },
        'Error searching payment methods',
      );
    }
  }
}

export default new PaymentMethodClient();
