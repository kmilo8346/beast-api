import Error from 'verror';
import Joi from '@hapi/joi';
import lodash from 'lodash';
import Router, { IMiddleware } from 'koa-router';

import orderClient from '../clients/order-client';
import { ActionParamsFactory } from '../../../schemas';
import { CancellationExecuter, Order, OrderStatus } from '../../../types';

const schema = ActionParamsFactory(
  Joi.object({
    cancellation_information: Joi.object({
      executer: Joi.string().required(),
      reason: Joi.string().optional(),
    }).required(),
  }).required(),
);

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const body = await schema.validateAsync(ctx.request.body, {
      stripUnknown: true,
    });
    // set formatted body
    ctx.request.body = body;
    await next();
  } catch (error) {
    ctx.throw(400, error);
  }
};

export default (router: Router) => {
  router.post('/:orderId/cancel', validate, async (ctx) => {
    // checking order state
    let order: Order | undefined;
    try {
      order = await orderClient.get(ctx.params.orderId);
    } catch (error) {
      if (lodash.get(Error.cause(error), 'meta.statusCode') === 404) {
        ctx.throw(404, error);
        return;
      }
      ctx.throw(500, error);
    }
    if (
      (ctx.request.body.executer === CancellationExecuter.CLIENT &&
        (order as Order).status !== OrderStatus.CREATED) ||
      (ctx.request.body.executer === CancellationExecuter.SELLER &&
        (order as Order).status !== OrderStatus.CREATED &&
        (order as Order).status !== OrderStatus.CONFIRMED)
    ) {
      ctx.throw(409, JSON.stringify({ current_state: order }));
    }

    try {
      const response = await orderClient.cancel(
        ctx.params.orderId,
        ctx.request.body,
      );
      ctx.body = response;
    } catch (error) {
      if (lodash.get(Error.cause(error), 'meta.statusCode') === 404) {
        ctx.throw(404, error);
        return;
      }

      ctx.throw(500, error);
    }
  });
};
