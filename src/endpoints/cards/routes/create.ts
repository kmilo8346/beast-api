import Router, { IMiddleware } from 'koa-router';
import Joi from '@hapi/joi';

import cardClient from '../clients/card-client';

const inputSchema = Joi.object({
  body: Joi.object({
    customer_id: Joi.string().required(),
    token: Joi.string().required(),
  }),
  source: Joi.array().items(Joi.string()).optional(),
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
  router.post('/', validate, async (ctx) => {
    try {
      const response = await cardClient.create(ctx.request.body);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
