import Error from 'verror';
import lodash from 'lodash';
import Router from 'koa-router';

import deviceClient from '../clients/device-client';

export default (router: Router) => {
  router.delete('/:deviceId', async (ctx) => {
    try {
      const response = await deviceClient.delete(ctx.params.deviceId);
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
