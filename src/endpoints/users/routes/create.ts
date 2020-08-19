import Router, { IMiddleware } from 'koa-router';

import userClient from '../clients/user-client';
import { CreateParamsFactory } from '../../../schemas';
import { CreateUserFactory } from '../schemas';

const schema = CreateParamsFactory(CreateUserFactory());

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    console.log('ctx.request.body', ctx.request.body);
    const body = await schema.validateAsync(ctx.request.body, {});
    console.log('validated', body);

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
      const response = await userClient.create(ctx.request.body);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
