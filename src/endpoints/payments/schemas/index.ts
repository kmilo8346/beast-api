import Joi from '@hapi/joi';

import { PlaceFactory, StoreFactory } from '../../../schemas';

export const ItemFactory = (optional = false) => {
  const schema = Joi.object({
    id: Joi.string().required(),
    type: Joi.string().allow('product').required(),
    name: Joi.string().required(),
    description: Joi.string().required(),
    images: Joi.array().items(Joi.string()).required(),
    price: Joi.number().required(),
    brand: Joi.string().optional().allow(''),
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
      'tags',
      'enabled',
      'qty',
      'created_at',
      'updated_at',
    ],
    (mySchema) => mySchema.optional(),
  );
};

export const TransactionFactory = (optional = false) => {
  const schema = Joi.object({
    country: Joi.string().required(),
    currency: Joi.string().required(),
    language: Joi.string().required(),
    delivery_address: PlaceFactory(optional).required(),
    shopping_cart: Joi.array()
      .items(ItemFactory(optional).required())
      .required(),
    store: StoreFactory(optional).required(),
  });

  if (!optional) {
    return schema;
  }
  return schema.fork(
    ['country', 'external_reference', 'delivery_address', 'shopping_cart'],
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

export const CreatePaymentFactory = (optional = false) => {
  const schema = Joi.object({
    customer: CustomerFactory(optional).required(),
    transaction: TransactionFactory(optional).required(),
    redirect_url: Joi.string().required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(['customer', 'transaction'], (mySchema) =>
    mySchema.optional(),
  );
};
