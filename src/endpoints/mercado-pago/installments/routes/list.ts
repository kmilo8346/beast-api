import Router, { IMiddleware } from 'koa-router';
import Joi from '@hapi/joi';

import installmentClient from '../clients/installment-client';

const paramSchema = Joi.object({
  payment_method_id: Joi.string().required(),
});
const querySchema = Joi.object({
  ammount: Joi.number().required(),
});

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const params = await paramSchema.validateAsync(ctx.params);
    const query = await querySchema.validateAsync(ctx.request.query);
    // set formatted params
    ctx.params = params;
    // set formatted query
    ctx.request.query = query;
    await next();
  } catch (error) {
    ctx.throw(400, error);
  }
};

export default (router: Router) => {
  router.get('/', validate, async (ctx) => {
    try {
      const response = await installmentClient.list(
        ctx.params.payment_method_id,
        ctx.request.query.ammount,
      );
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
