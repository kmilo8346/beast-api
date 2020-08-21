import Router, { IMiddleware } from 'koa-router';

import { ComputeParamsFactory } from '../schemas';
import widgetClient from '../clients/widget-client';

const schema = ComputeParamsFactory();

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
  router.post('/compute', validate, async (ctx) => {
    try {
      const response = await widgetClient.compute(ctx.request.body);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
