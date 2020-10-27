import Router, { IMiddleware } from 'koa-router';

// local schemas
import { CreateCheckoutFactory } from '../schemas';
// schemas
import { CreateParamsFactory } from '../../../../schemas';
// local clients
import checkoutClient from '../clients/checkout-client';

const schema = CreateParamsFactory(CreateCheckoutFactory().required());

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
      const response = await checkoutClient.create(ctx.request.body);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
