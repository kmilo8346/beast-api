import Router, { IMiddleware } from 'koa-router';

import { CreateParamsFactory } from '../../../schemas';
import { CreateShopIntentFactory } from '../schemas';
import shopIntentClient from '../clients/shop-client';

const schema = CreateParamsFactory(CreateShopIntentFactory().required());

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const validProduct = await schema.validateAsync(ctx.request.body, {
      stripUnknown: true,
    });
    console.log(JSON.stringify(validProduct));
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
      const response = await shopIntentClient.create(ctx.request.body);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
