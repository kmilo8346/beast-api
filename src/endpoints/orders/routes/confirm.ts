import Error from 'verror';
import lodash from 'lodash';
import Router, { IMiddleware } from 'koa-router';

import orderClient from '../clients/order-client';
import { Order, OrderStatus } from '../../../types';
import { ActionParamsFactory } from '../../../schemas';

const schema = ActionParamsFactory();

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
  router.post('/:orderId/confirm', validate, async (ctx) => {
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
    if ((order as Order).status !== OrderStatus.CREATED) {
      ctx.throw(409, JSON.stringify({ current_state: order }));
    }

    try {
      const response = await orderClient.confirm(
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
