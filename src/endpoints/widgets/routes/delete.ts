import Error from 'verror';
import lodash from 'lodash';
import Router from 'koa-router';

import productClient from '../clients/widget-client';

export default (router: Router) => {
  router.delete('/:widgetId', async (ctx) => {
    try {
      const response = await productClient.delete(ctx.params.widgetId);
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
