import Router, { IMiddleware } from 'koa-router';
import Joi from '@hapi/joi';

import productClient from '../clients/product-client';
import { Product } from '../../../types/index';

const deliveryAreaSchema = Joi.object().keys({
  center: Joi.object({
    id: Joi.string(),
    url: Joi.string().uri(),
    street_number: Joi.object({
      short_name: Joi.string(),
      long_name: Joi.string(),
    }),
    route: Joi.object({
      short_name: Joi.string(),
      long_name: Joi.string(),
    }),
    locality: Joi.object({
      short_name: Joi.string(),
      long_name: Joi.string(),
    }),
    administrative_area_level_3: Joi.object({
      short_name: Joi.string(),
      long_name: Joi.string(),
    }),
    administrative_area_level_2: Joi.object({
      short_name: Joi.string(),
      long_name: Joi.string(),
    }),
    administrative_area_level_1: Joi.object({
      short_name: Joi.string(),
      long_name: Joi.string(),
    }),
    apartment: Joi.string(),
    geometry: Joi.object({
      location: Joi.object({
        lat: Joi.string(),
        lng: Joi.string(),
      }),
      viewport: Joi.object({
        northeast: Joi.object({
          lat: Joi.string(),
          lng: Joi.string(),
        }),
        southwest: Joi.object({
          lat: Joi.string(),
          lng: Joi.string(),
        }),
      }),
    }),
  }),
  radius: Joi.string(),
});

const storeSchema = Joi.object().keys({
  id: Joi.string().required(),
  version: Joi.number().optional(),
  name: Joi.string().optional(),
  phone: Joi.string().optional(),
  images: Joi.array().items(Joi.string()).optional(),
  delivery_time: Joi.object({
    lte: Joi.number(),
    gte: Joi.number(),
  }).optional(),
  delivery_area: deliveryAreaSchema.optional(),
  opening_hours: Joi.array().items(
    Joi.object({
      day: Joi.number().min(1).max(7),
      open: Joi.number().min(0).max(2359),
      close: Joi.number().min(0).max(2359),
    }).optional(),
  ),
  seller_credentials: Joi.object({
    access_token: Joi.string(),
    expiresIn: Joi.number(),
    live_mode: Joi.boolean(),
    public_key: Joi.string(),
    refresh_token: Joi.string(),
    scope: Joi.string(),
    token_type: Joi.string(),
    user_id: Joi.number(),
  }).optional(),
});

const updateSchema = Joi.object({
  type: Joi.string().allow('product', 'service').optional(),
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  images: Joi.array().items(Joi.string()).optional(),
  price: Joi.number().optional(),
  brand: Joi.string().optional(),
  format: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()),
  categories: Joi.array().items(Joi.string()).optional(),
  store: storeSchema.required(),
  qty: Joi.number().optional(),
});

const idSchema = Joi.string().required();

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const id = await idSchema.validateAsync(ctx.params.id);
    const body = await updateSchema.validateAsync(ctx.request.body);
    // set formatted body
    ctx.params.id = id;
    ctx.request.body = body;
    await next();
  } catch (error) {
    ctx.throw(400, error);
  }
};

export default (router: Router) => {
  router.put('/:id', validate, async (ctx) => {
    try {
      const response = await productClient.update({
        id: ctx.params.id,
        body: ctx.request.body,
      });
      ctx.body = response;
    } catch (error) {
      if (error.name === 'Not Found') {
        ctx.throw(404, error);
      } else {
        ctx.throw(500, error);
      }
    }
  });
};
