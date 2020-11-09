import Router, { IMiddleware } from 'koa-router';
import Joi from '@hapi/joi';

import phoneClient from '../clients/phone-client';

const schema = Joi.object({
  phone: Joi.string().required(),
});

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const value = await schema.validateAsync(ctx.request.body);

    // set formatted body
    ctx.request.body = value;
    await next();
  } catch (error) {
    ctx.throw(400, error);
  }
};

export default (router: Router) => {
  router.post('/code', validate, async (ctx) => {
    try {
      const response = await phoneClient.code(ctx.request.body);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
