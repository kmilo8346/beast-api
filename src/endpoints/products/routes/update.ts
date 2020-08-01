import Router, { IMiddleware } from 'koa-router';

import { UpdateParamsFactory } from '../../../schemas';
import { ProductFactory } from '../schemas';
import productClient from '../clients/product-client';

const schema = UpdateParamsFactory(ProductFactory(true));

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
  router.put('/:productId', validate, async (ctx) => {
    try {
      const response = await productClient.update(
        ctx.params.storeId,
        ctx.params.productId,
        ctx.request.body,
      );
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
