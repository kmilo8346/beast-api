import Joi from '@hapi/joi';

import { PlaceFactory, StoreFactory, ProductFactory } from '../../../schemas';
import { DispatchProvider } from '../../../types';

export const ItemFactory = () => {
  const schema = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    price: Joi.number().required(),
    enabled: Joi.boolean().required(),
    reference: Joi.string().required(),
    description: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).required(),
    images: Joi.array().items(Joi.string()).required(),
    qty: Joi.number().required(),
    created_at: Joi.date().required(),
    updated_at: Joi.date().required(),
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
  const ownerSchema = Joi.object({
    customer: CustomerFactory().required(),
    transaction: Joi.object({
      country: Joi.string().required(),
      currency: Joi.string().required(),
      language: Joi.string().required(),
      delivery_address: PlaceFactory().required(),
      shopping_cart: Joi.array().items(ItemFactory().required()).required(),
      store: StoreFactory().required(),
    }).required(),
    redirect_url: Joi.string().required(),
    // TODO: make required
    payment_provider_id: Joi.string().default('mercadopago').optional(),
    // TODO: make required
    dispatch_provider_id: Joi.string().default('owner').optional(),
  });

  const ownerRRSSSchema = Joi.object({
    transaction: Joi.object({
      country: Joi.string().required(),
      currency: Joi.string().required(),
      language: Joi.string().required(),
      shopping_cart: Joi.array().items(ItemFactory().required()).required(),
      store: StoreFactory().required(),
    }).required(),
    payment_provider_id: Joi.string().valid('mercadopago').required(),
    dispatch_provider_id: Joi.string().valid('owner_rrss').required(),
  });

  return Joi.alternatives().conditional(
    '.transaction.store.dispatch_provider',
    {
      switch: [
        { is: DispatchProvider.OWNER_RRSS, then: ownerRRSSSchema },
        { is: DispatchProvider.OWNER, then: ownerSchema },
      ],
    },
  );
};
