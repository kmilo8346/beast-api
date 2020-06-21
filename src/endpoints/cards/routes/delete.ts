import Router, { IMiddleware } from 'koa-router';
import Joi from '@hapi/joi';

import cardClient from '../clients/card-client';

const inputSchema = Joi.object({
  customer_id: Joi.string().required(),
  card_id: Joi.string().required(),
});

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const value = await inputSchema.validateAsync(ctx.params);
    // set formatted params
    ctx.params = value;
    await next();
  } catch (error) {
    ctx.throw(400, error);
  }
};

export default (router: Router) => {
  router.delete('/:card_id', validate, async (ctx) => {
    try {
      const response = await cardClient.delete(
        ctx.params.customer_id,
        ctx.params.card_id,
      );
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
