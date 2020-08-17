import Router from 'koa-router';
import Error from 'verror';
import lodash from 'lodash';

import productClient from '../clients/product-client';

export default (router: Router) => {
  router.delete('/:productId', async (ctx) => {
    try {
      const response = await productClient.delete(
        ctx.params.storeId,
        ctx.params.productId,
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
