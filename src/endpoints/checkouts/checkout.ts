import { PaymentProviderState, CreateCheckout } from '../../types';

abstract class ICheckout {
  abstract create(data: CreateCheckout): Promise<PaymentProviderState>;
}

export default ICheckout;
