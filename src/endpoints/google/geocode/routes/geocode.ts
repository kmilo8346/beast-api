import Router, { IMiddleware } from 'koa-router';
import Joi from '@hapi/joi';

import geocodeClient from '../clients/geocode-client';

const inputSchema = Joi.object({
  address: Joi.string().required(),
});

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const value = await inputSchema.validateAsync(ctx.request.query);
    // set formatted query
    ctx.request.query = value;
    await next();
  } catch (error) {
    ctx.throw(400, error);
  }
};

export default (router: Router) => {
  router.get('/', validate, async (ctx) => {
    try {
      const response = await geocodeClient.geocode(ctx.request.query.address);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
