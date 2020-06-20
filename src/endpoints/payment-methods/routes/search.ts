import Router, { IMiddleware } from 'koa-router';
import Joi from '@hapi/joi';

import paymentMethodClient from '../clients/payment-method-client';

const inputSchema = Joi.object({
  bins: Joi.string().required(),
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
      const response = await paymentMethodClient.search(ctx.request.body);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
