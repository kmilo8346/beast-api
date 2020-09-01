import Router, { IMiddleware } from 'koa-router';

import { ComputeParamsFactory } from '../schemas';
import widgetClient from '../clients/widget-client';

const schema = ComputeParamsFactory();

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const query = await schema.validateAsync(ctx.query, {
      convert: true,
      stripUnknown: true,
    });
    // set formatted query
    ctx.state.query = query;
    await next();
  } catch (error) {
    ctx.throw(400, error);
  }
};

export default (router: Router) => {
  router.get('/compute', validate, async (ctx) => {
    try {
      const response = await widgetClient.compute(ctx.state.query);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
