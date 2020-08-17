import Router, { IMiddleware } from 'koa-router';

import productClient from '../clients/product-client';
import { CreateParamsFactory } from '../../../schemas';
import { CreateProductFactory } from '../schemas';

const schema = CreateParamsFactory(CreateProductFactory());

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
  router.post('/', validate, async (ctx) => {
    try {
      const response = await productClient.create(
        ctx.params.storeId,
        ctx.request.body,
      );
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
