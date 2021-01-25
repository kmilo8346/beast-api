import Router, { IMiddleware } from 'koa-router';
import Error from 'verror';
import lodash from 'lodash';

import { GetParamsFactory } from '../../../schemas';
import productClient from '../clients/product-client';

const schema = GetParamsFactory();

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const value = await schema.validateAsync(ctx.state.query);
    // set formatted params
    ctx.state.query = value;
    await next();
  } catch (error) {
    ctx.throw(400, error);
  }
};

export default (router: Router) => {
  router.get('/:productId', validate, async (ctx) => {
    try {
      const response = await productClient.get(
        ctx.params.storeId,
        ctx.params.productId,
        ctx.state.query.source,
      );
      ctx.body = response;
    } catch (error) {
      if (lodash.get(Error.cause(error), 'meta.statusCode') === 404) {
        ctx.throw(404, error);
        return;
      }
      ctx.throw(500, error);
    }
  });
};
