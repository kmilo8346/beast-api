import Router, { IMiddleware } from 'koa-router';
import Joi from '@hapi/joi';

import productClient from '../clients/product-client';

const deliveryAreaSchema = Joi.object().keys({
  center: Joi.object({
    id: Joi.string(),
    url: Joi.string().uri(),
    street_number: Joi.object({
      short_name: Joi.string().required(),
      long_name: Joi.string(),
    }).required(),
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
  radius: Joi.string().required(),
});

const storeSchema = Joi.object().keys({
  id: Joi.string().required(),
  version: Joi.number().required(),
  name: Joi.string().required(),
  phone: Joi.string().required(),
  images: Joi.array().items(Joi.string()),
  delivery_time: Joi.object({
    lte: Joi.number(),
    gte: Joi.number(),
  }).required(),
  delivery_area: deliveryAreaSchema.required(),
  opening_hours: Joi.array()
    .items(
      Joi.object({
        day: Joi.number().min(1).max(7).required(),
        open: Joi.number().min(0).max(2359).required(),
        close: Joi.number().min(0).max(2359).required(),
      }),
    )
    .required(),
  seller_credentials: Joi.object({
    access_token: Joi.string().required(),
    expires_in: Joi.number().required(),
    live_mode: Joi.boolean().required(),
    public_key: Joi.string().required(),
    refresh_token: Joi.string().required(),
    scope: Joi.string().required(),
    token_type: Joi.string().required(),
    user_id: Joi.number().required(),
  }).required(),
});

const productSchema = Joi.object({
  type: Joi.string().allow('product', 'service').required(),
  name: Joi.string().required(),
  description: Joi.string().optional(),
  images: Joi.array().items(Joi.string()),
  price: Joi.number().optional(),
  brand: Joi.string().optional(),
  format: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()),
  categories: Joi.array().items(Joi.string()).required(),
  store: storeSchema.required(),
  qty: Joi.number(),
});

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const validProduct = await productSchema.validateAsync(ctx.request.body);
    // set formatted body
    ctx.request.body = validProduct;
    await next();
  } catch (error) {
    ctx.throw(400, error);
  }
};

export default (router: Router) => {
  router.post('/', validate, async (ctx) => {
    try {
      const response = await productClient.create({
        body: { ...ctx.request.body },
      });
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
