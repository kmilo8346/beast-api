import Router, { IMiddleware } from 'koa-router';
import Joi from '@hapi/joi';

import productClient from '../clients/product-client';

const inputSchema = Joi.object({
  query: Joi.string(),
  filters: Joi.object().keys({
    position: Joi.array().items(Joi.number()).length(2),
    store: Joi.string(),
  }),
  from: Joi.number().integer().min(0).default(0),
  size: Joi.number().min(0).max(100).default(10),
  source: Joi.array().items(Joi.string()),
});

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const value = await inputSchema.validateAsync(ctx.request.body);
    // set formatted body
    ctx.request.body = value;
    await next();
  } catch (error) {
    ctx.throw(400, error);
  }
};

export default (router: Router) => {
  router.post('/search', validate, async (ctx) => {
    try {
      const response = await productClient.search(ctx.request.body);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
