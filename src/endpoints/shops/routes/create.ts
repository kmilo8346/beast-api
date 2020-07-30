import Router, { IMiddleware } from 'koa-router';

import { CreateParamsFactory } from '../../../schemas';
import { CreateShopFactory } from '../schemas';
import shopClient from '../clients/shop-client';

const schema = CreateParamsFactory(CreateShopFactory().required());

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
      const response = await shopClient.create(ctx.request.body);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
