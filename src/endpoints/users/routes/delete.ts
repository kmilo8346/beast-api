import Router from 'koa-router';
import Error from 'verror';
import lodash from 'lodash';

import userClient from '../clients/user-client';

export default (router: Router) => {
  router.delete('/:userId', async (ctx) => {
    try {
      const response = await userClient.delete(ctx.params.userId);
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
