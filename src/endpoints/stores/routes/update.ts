import Router, { IMiddleware } from 'koa-router';

import { UpdateParamsFactory, StoreFactory } from '../../../schemas';
import StoreClient from '../clients/store-client';

const schema = UpdateParamsFactory(StoreFactory(true));

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
  router.put('/:storeId', validate, async (ctx) => {
    try {
      const response = await StoreClient.update(
        ctx.params.storeId,
        ctx.request.body,
      );
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
