import Router, { IMiddleware } from 'koa-router';
import Error from 'verror';
import lodash from 'lodash';

import { UpdateParamsFactory, ProductFactory } from '../../../schemas';
import productClient from '../clients/product-client';

const schema = UpdateParamsFactory(ProductFactory(true));

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
  router.put('/:productId', validate, async (ctx) => {
    try {
      const response = await productClient.update(
        ctx.params.storeId,
        ctx.params.productId,
        ctx.request.body,
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
