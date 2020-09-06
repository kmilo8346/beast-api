import Joi from '@hapi/joi';

import { PlaceFactory, StoreFactory, ProductFactory } from '../../../schemas';

export const ItemFactory = () => {
  const schema = ProductFactory().keys({
    qty: Joi.number().required(),
  });

  return schema;
};

export const TransactionFactory = () => {
  const schema = Joi.object({
    country: Joi.string().required(),
    currency: Joi.string().required(),
    language: Joi.string().required(),
    delivery_address: PlaceFactory().required(),
    shopping_cart: Joi.array().items(ItemFactory().required()).required(),
    store: StoreFactory().required(),
  });

  return schema;
};

export const CustomerFactory = () => {
  const schema = Joi.object({
    id: Joi.string().required(),
    email: Joi.string().email().required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().allow('').optional(),
    photo_url: Joi.string().optional(),
    phone: Joi.string().required(),
  });
  return schema;
};

export const CreatePaymentFactory = () => {
  const schema = Joi.object({
    customer: CustomerFactory().required(),
    transaction: TransactionFactory().required(),
    redirect_url: Joi.string().required(),
  });
  return schema;
};
