import Router, { IMiddleware } from 'koa-router';

import { SearchParamsFactory } from '../../../schemas';
import { SearchFiltersFactory } from '../schemas';
import widgetClient from '../clients/widget-client';

const schema = SearchParamsFactory(SearchFiltersFactory());

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const body = await schema.validateAsync(ctx.request.body);

    // set formatted body
    ctx.request.body = body;
    await next();
  } catch (error) {
    ctx.throw(400, error);
  }
};

export default (router: Router) => {
  router.post('/search', validate, async (ctx) => {
    try {
      const response = await widgetClient.search(ctx.request.body);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
