import Router, { IMiddleware } from 'koa-router';

import { CreateParamsFactory, CreateStoreFactory } from '../../../schemas';
import storeClient from '../clients/store-client';

const schema = CreateParamsFactory(CreateStoreFactory());

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const validProduct = await schema.validateAsync(ctx.request.body, {
      stripUnknown: true,
    });
    // set formatted body
    ctx.request.body = validProduct;
    await next();
  } catch (error) {
    ctx.throw(400, error);
  }
};

export default (router: Router) => {
  router.post('/', validate, async (ctx) => {
    try {
      const response = await storeClient.create(ctx.request.body);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
