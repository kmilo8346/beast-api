import Router, { IMiddleware } from 'koa-router';

import { CreateNotificationFactory } from '../schemas';
import { CreateParamsFactory } from '../../../schemas';
import notificationClient from '../clients/notification-client';

const schema = CreateParamsFactory(CreateNotificationFactory());

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
      const response = await notificationClient.create(ctx.request.body);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
