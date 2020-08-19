import Router, { IMiddleware } from 'koa-router';
import conditional from 'koa-conditional-get';
import etag from 'koa-etag';
import Error from 'verror';
import lodash from 'lodash';

import { GetParamsFactory } from '../../../schemas';
import userClient from '../clients/user-client';

const schema = GetParamsFactory();

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const query = await schema.validateAsync(ctx.query, { stripUnknown: true });

    // set formatted params
    ctx.query = query;
    await next();
  } catch (error) {
    ctx.throw(400, error);
  }
};

export default (router: Router) => {
  router.use(conditional());
  router.use(etag());

  router.get('/:userId', validate, async (ctx) => {
    try {
      const response = await userClient.get(
        ctx.params.userId,
        ctx.query.source,
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
