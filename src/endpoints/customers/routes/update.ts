import Router, { IMiddleware } from 'koa-router';
import Joi from '@hapi/joi';

import customerClient from '../clients/customer-client';

const inputSchema = Joi.object({
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
  first_name: Joi.string().optional(),
  last_name: Joi.string().optional(),
  identification_type: Joi.string().optional(),
  indentification_number: Joi.string().optional(),
  default_address: Joi.string().allow('').optional(),
  default_card: Joi.string().allow('').optional(),
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
  router.put('/:customer_id', validate, async (ctx) => {
    try {
      const response = await customerClient.update(
        ctx.params.customer_id,
        ctx.request.body,
      );
      ctx.body = '';
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
