import Joi from '@hapi/joi';
import { PlaceFactory, ProductFactory, StoreFactory } from '../../../schemas';

export const SearchFiltersFactory = () =>
  Joi.object().keys({
    idempotency: Joi.string().optional(),
    store: Joi.string().optional(),
    seller: Joi.string().optional(),
    customer: Joi.string().optional(),
    water_mark: Joi.string().optional(),
  });

const ConfirmationFactory = () =>
  Joi.object().keys({
    status: Joi.string()
      .valid('full_stock', 'partial_stock', 'out_of_stock')
      .required(),
    product_confirmations: Joi.array()
      .items(
        Joi.alternatives().try(
          {
            type: Joi.string().allow('update').required(),
            id: Joi.string().required(),
            qty_posible: Joi.number().required(),
          },
          {
            type: Joi.string().allow('delete').required(),
            id: Joi.string().required(),
          },
        ),
      )
      .required(),
  });

const ProviderFactory = () =>
  Joi.object().keys({
    confirmation: ConfirmationFactory().required(),
  });

export const ConfirmDataFactory = () =>
  Joi.object().keys({
    dispatch_provider: ProviderFactory().required(),
  });

export const CreateOrderFactory = () =>
  Joi.object({
    idempotency: Joi.string().required(),
    customer: Joi.object({
      id: Joi.string().required(),
      email: Joi.string().email().required(),
      first_name: Joi.string().required(),
      last_name: Joi.string().allow('').optional(),
      photo_url: Joi.string().required(),
      phone: Joi.string().required(),
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
