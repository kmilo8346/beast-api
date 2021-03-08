import Router, { IMiddleware } from 'koa-router';

import { SearchFiltersFactory } from '../schemas';
import { SearchParamsFactory } from '../../../schemas';
import notificationClient from '../clients/notification-client';

const schema = SearchParamsFactory(SearchFiltersFactory());

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
  router.get('/', validate, async (ctx) => {
    try {
      const response = await notificationClient.search(ctx.state.query);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
