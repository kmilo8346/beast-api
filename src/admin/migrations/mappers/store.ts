// types
import { Store } from '../../../types';
// migration mappers
import placeMap from './place';

export default (store: Store) => {
  const {
    seller_credentials,
    payment_provider,
    dispatch_provider,
    ...result
  } = store as any;
  return {
    ...result,
    delivery_area: {
      ...result.delivery_area,
      center: placeMap(result.delivery_area.center),
    },
    enabled: true,
    payment_provider: { credentials: seller_credentials },
  };
};
