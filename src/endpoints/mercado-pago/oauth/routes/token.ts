import Router, { IMiddleware } from 'koa-router';
import Joi from '@hapi/joi';

import oauthClient from '../clients/oauth-client';

const inputSchema = Joi.object({
  body: Joi.object({
    code: Joi.string().required(),
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
  router.post('/token', validate, async (ctx) => {
    try {
      const response = await oauthClient.token(ctx.request.body);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
