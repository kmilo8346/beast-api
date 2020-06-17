import Router, { IMiddleware } from 'koa-router';
import Joi from '@hapi/joi';

import placesClient from '../clients/places-client';

const inputSchema = Joi.object({
  place_id: Joi.string().required(),
  sessiontoken: Joi.string().required(),
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
  router.get('/details', validate, async (ctx) => {
    try {
      const { place_id, sessiontoken } = ctx.request.query;
      const response = await placesClient.details(place_id, sessiontoken);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
