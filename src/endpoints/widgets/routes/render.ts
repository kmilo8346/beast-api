import Router, { IMiddleware } from 'koa-router';

import widgetClient from '../clients/widget-client';
import { RenderParamsFactory, SearchFiltersFactory } from '../schemas';

const schema = RenderParamsFactory(SearchFiltersFactory());

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const query = await schema.validateAsync(ctx.state.query, {
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
  router.get('/render', validate, async (ctx) => {
    try {
      const response = await widgetClient.render(ctx.state.query);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
