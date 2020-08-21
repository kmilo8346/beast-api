import Router from 'koa-router';
import Error from 'verror';
import lodash from 'lodash';

import widgetClient from '../clients/widget-client';

export default (router: Router) => {
  router.delete('/:widgetId', async (ctx) => {
    try {
      const response = await widgetClient.delete(ctx.params.widgetId);
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
