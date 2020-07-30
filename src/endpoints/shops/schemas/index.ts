import Joi from '@hapi/joi';

import { PlaceFactory, CardFactory, StoreFactory } from '../../../schemas';

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

export const ItemFactory = (optional = false) => {
  const schema = Joi.object({
    id: Joi.string().required(),
    type: Joi.string().allow('product').required(),
    name: Joi.string().required(),
    description: Joi.string().required(),
    images: Joi.array().items(Joi.string()).required(),
    price: Joi.number().required(),
    brand: Joi.string().optional().allow(''),
    category: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).optional(),
    enabled: Joi.boolean().required(),
    qty: Joi.number().required(),
    created_at: Joi.date().required(),
    updated_at: Joi.date().required(),
  });

  if (!optional) {
    return schema;
  }
  return schema.fork(
    [
      'id',
      'type',
      'name',
      'description',
      'images',
      'price',
      'brand',
      'category',
      'tags',
      'enabled',
      'qty',
      'created_at',
      'updated_at',
    ],
    (mySchema) => mySchema.optional(),
  );
};

export const ShoppingCartItemFactory = (optional = false) => {
  const schema = Joi.object({
    store: StoreFactory(optional).required(),
    data: Joi.array().items(ItemFactory(optional).required()),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(['store', 'data'], (mySchema) => mySchema.optional());
};

export const ShoppingCartFactory = (optional = false) => {
  // TODO: fix, not working
  const schema = Joi.array().items(
    ShoppingCartItemFactory(optional).required(),
  );
  return schema;
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

export const CustomerFactory = (optional = false) => {
  const schema = Joi.object({
    id: Joi.string().required(),
    email: Joi.string().email().required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().optional(),
    photo_url: Joi.string().optional(),
    mercado_pago_customer_id: Joi.string().required(),
    phone: Joi.string().required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(
    [
      'id',
      'email',
      'identification_type',
      'identification_number',
      'first_name',
      'last_name',
      'photo_url',
      'mercado_pago_customer_id',
      'phone',
      'address',
      'payment_method',
    ],
    (mySchema) => mySchema.optional(),
  );
};

export const CreateShopFactory = (optional = false) => {
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

export const ShopFactory = (optional = false) => {
  const schema = CreateShopFactory(optional).keys({
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
