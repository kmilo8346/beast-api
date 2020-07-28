import Joi from '@hapi/joi';

import {
  CustomerFactory,
  PlaceFactory,
  CardFactory,
  ShoppingCartFactory,
} from '../../../schemas';

export const PaymentInfoFactory = (optional = false) => {
  const schema = Joi.object({
    card: CardFactory(optional).required(),
    security_code: Joi.string().required(),
    installments: Joi.number().required(),
  });

  if (!optional) {
    return schema;
  }
  return schema.fork(['card', 'security_code', 'installments'], (mySchema) =>
    mySchema.optional(),
  );
};

export const TransactionFactory = (optional = false) => {
  const schema = Joi.object({
    country: Joi.string().required(),
    currency: Joi.string().required(),
    language: Joi.string().required(),
    delivery_address: PlaceFactory(optional).required(),
    shopping_cart: ShoppingCartFactory(optional).required(),
    payment_method: Joi.string().allow('CREDIT_CARD', 'TO_AGREE').required(),
    payment_info: PaymentInfoFactory(optional).optional(),
  });

  if (!optional) {
    return schema;
  }
  return schema.fork(
    [
      'country',
      'external_reference',
      'delivery_address',
      'shopping_cart',
      'payment_method',
      'payment_info',
    ],
    (mySchema) => mySchema.optional(),
  );
};

export const CreateShopIntentFactory = (optional = false) => {
  const schema = Joi.object({
    customer: CustomerFactory(optional).required(),
    transaction: TransactionFactory(optional).required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(['customer', 'transaction'], (mySchema) =>
    mySchema.optional(),
  );
};

export const ShopIntentFactory = (optional = false) => {
  const schema = CreateShopIntentFactory(optional).keys({
    id: Joi.string().allow('CL').required(),
    created_at: Joi.string().allow('CL').required(),
    updated_at: Joi.string().allow('CL').required(),
  });

  if (!optional) {
    return schema;
  }
  return schema.fork(
    ['id', 'status', 'orders_status', 'created_at', 'updated_at'],
    (mySchema) => mySchema.optional(),
  );
};
