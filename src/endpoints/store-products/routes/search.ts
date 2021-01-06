import Router, { IMiddleware } from 'koa-router';

import { SearchParamsFactory } from '../../../schemas';
import { SearchFiltersFactory } from '../schemas';
import storeProductClient from '../clients/store-product-client';

const schema = SearchParamsFactory(SearchFiltersFactory());

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const query = await schema.validateAsync(ctx.state.query, {
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
  router.get('/', validate, async (ctx) => {
    try {
      const response = await storeProductClient.search(ctx.state.query);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
