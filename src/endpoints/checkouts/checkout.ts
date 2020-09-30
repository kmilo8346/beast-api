import { MercadopagoPaymentProviderState, CreateCheckout } from '../../types';

abstract class ICheckout {
  abstract create(
    data: CreateCheckout,
  ): Promise<MercadopagoPaymentProviderState>;
}

export default ICheckout;
