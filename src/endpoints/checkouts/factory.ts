import Error from 'verror';

import { PaymentProvider } from '../../types';
import MercadoPagoCheckout from './mercadopago';

export default (paymentProvider: PaymentProvider) => {
  switch (paymentProvider) {
    case PaymentProvider.MERCADOPAGO:
      return new MercadoPagoCheckout();
    default:
      throw new Error(
        { info: { paymentProvider } },
        'Payment provider not mapped',
      );
  }
};
