import lodash from 'lodash';
import Router, { IMiddleware } from 'koa-router';

import { SearchFiltersFactory } from '../schemas';
import productClient from '../clients/product-client';
import { SearchParamsFactory } from '../../../schemas';
import storeProductClient from '../../store-products/clients/store-product-client';

const complex_filters = ['store_enabled', 'location'];
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
      // if request require complex filters
      // use store product client
      if (complex_filters.some((f) => f in ctx.state.query.filters)) {
        // adapt to store filter

        if (ctx.params.storeId !== 'all') {
          ctx.state.query.filters.store = ctx.params.storeId;
        }

        // using store product client
        const response = await storeProductClient.search(ctx.state.query);
        ctx.body = response;
      } else {
        // using product client
        const response = await productClient.search(
          ctx.params.storeId,
          ctx.state.query,
        );
        response.hits = response.hits.map((hit) => ({
          ...hit,
          // compatibility code
          // app <= 1.0.68
          store_info: {
            id: hit.store,
          },
        }));
        ctx.body = response;
      }
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
