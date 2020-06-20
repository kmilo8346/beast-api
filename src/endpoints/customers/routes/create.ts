import Router, { IMiddleware } from 'koa-router';
import Joi from '@hapi/joi';

import customerClient from '../clients/customer-client';

const inputSchema = Joi.object({
  phone: Joi.string().required(),
  email: Joi.string().email().required(),
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  identification_type: Joi.string().required(),
  indentification_number: Joi.string().required(),
  default_address: Joi.string().allow(''),
  default_card: Joi.string().allow(''),
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
      const response = await customerClient.create(ctx.request.body);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
