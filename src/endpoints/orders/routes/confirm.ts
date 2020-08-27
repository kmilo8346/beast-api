import Router, { IMiddleware } from 'koa-router';

import { ActionParamsFactory } from '../../../schemas';
import { ConfirmDataFactory } from '../schemas';
import orderClient from '../clients/order-client';

const schema = ActionParamsFactory(ConfirmDataFactory()).required();

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const body = await schema.validateAsync(ctx.request.body);
    // set formatted body
    ctx.request.body = body;
    await next();
  } catch (error) {
    ctx.throw(400, error);
  }
};

export default (router: Router) => {
  router.post('/:orderId/confirm', validate, async (ctx) => {
    try {
      const response = await orderClient.confirm(
        ctx.params.orderId,
        ctx.request.body,
      );
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
