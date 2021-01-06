import Joi from '@hapi/joi';
import { PlaceFactory, StoreFactory } from '../../../schemas';

export const SearchFiltersFactory = () =>
  Joi.object().keys({
    idempotency: Joi.string().optional(),
    store: Joi.string().optional(),
    seller: Joi.string().optional(),
    customer: Joi.string().optional(),
    water_mark: Joi.string().optional(),
    should_client: Joi.string().optional(),
    should_seller: Joi.string().optional(),
  });

export const CreateOrderFactory = () =>
  Joi.object({
    idempotency: Joi.string().required(),
    customer: Joi.object({
      id: Joi.string().required(),
      email: Joi.string().email().allow(null).optional(),
      first_name: Joi.string().required(),
      last_name: Joi.string().allow('', null).optional(),
      photo_url: Joi.string().allow(null).optional(),
      phone: Joi.string().required(),
      created_at: Joi.date().optional(),
    }).required(),
    transaction: Joi.object({
      country: Joi.string().required(),
      currency: Joi.string().required(),
      language: Joi.string().required(),
      delivery_address: PlaceFactory().required(),
      shopping_cart: Joi.object({
        store: StoreFactory().required(),
        items: Joi.array()
          .items(
            Joi.object({
              id: Joi.string().required(),
              qty: Joi.number().required(),
              name: Joi.string().required(),
              price: Joi.number().required(),
              enabled: Joi.boolean().required(),
              reference: Joi.string().required(),
              description: Joi.string().optional(),
              tags: Joi.array().items(Joi.string()).required(),
              images: Joi.array().items(Joi.string()).required(),
              created_at: Joi.date().required(),
              updated_at: Joi.date().required(),
            }).required(),
          )
          .min(1)
          .required(),
      }),
    }).required(),
  }).required();
