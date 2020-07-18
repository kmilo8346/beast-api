import Router from 'koa-router';

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
      ctx.throw(500, error);
    }
  });
};
