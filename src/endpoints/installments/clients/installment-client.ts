import Error from 'verror';

import mercadopago from '../../../beast/clients/mercadopago';

class InstallmentClient {
  /**
   *
   * @param paymentMethodId
   * @param ammount
   */
  async list(paymentMethodId: string, ammount: number): Promise<any> {
    try {
      const response = await mercadopago.installments.get(
        paymentMethodId,
        ammount,
      );
      let installments = [];
      if (response.length) {
        installments = response[0].payer_costs.map(
          (payerCost: {
            installments: number;
            recommended_message: string;
          }) => ({
            installments: payerCost.installments,
            recommended_message: payerCost.recommended_message,
          }),
        );
      }
      return {
        total: installments.length,
        hits: installments,
      };
    } catch (error) {
      throw new Error({ cause: error, info: {} }, 'Error listing installments');
    }
  }
}

export default new InstallmentClient();
