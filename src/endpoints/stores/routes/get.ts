import Router, { IMiddleware } from 'koa-router';
import conditional from 'koa-conditional-get';
import etag from 'koa-etag';

import { GetParamsFactory } from '../../../schemas';
import storeClient from '../clients/store-client';

const schema = GetParamsFactory();

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const value = await schema.validateAsync(ctx.query);
    // set formatted params
    ctx.query = value;
    await next();
  } catch (error) {
    ctx.throw(400, error);
  }
};

export default (router: Router) => {
  router.use(conditional());
  router.use(etag());

  router.get('/:storeId', validate, async (ctx) => {
    try {
      const response = await storeClient.get(
        ctx.params.storeId,
        ctx.query.source,
      );
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
