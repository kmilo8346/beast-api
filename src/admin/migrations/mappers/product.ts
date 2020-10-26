// types
import { Product } from '../../../types';

export default (product: Product) => ({
  ...product,
  store_info: {
    ...product.store_info,
    enabled: true,
  },
});
