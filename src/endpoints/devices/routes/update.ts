import Router, { IMiddleware } from 'koa-router';
import Error from 'verror';
import lodash from 'lodash';

import utils from '../../../beast/utils';
import { DeviceFactory } from '../schemas';
import deviceClient from '../clients/device-client';
import { UpdateParamsFactory } from '../../../schemas';

const schema = UpdateParamsFactory(DeviceFactory(true));

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const body = await schema.validateAsync(ctx.request.body, {
      stripUnknown: true,
    });
    // add app version num
    if (body.app_version) {
      body.app_version_num = utils.convertVersionToInt(body.app_version);
    }
    // set formatted body
    ctx.request.body = body;
    await next();
  } catch (error) {
    ctx.throw(400, error);
  }
};

export default (router: Router) => {
  router.put('/:deviceId', validate, async (ctx) => {
    try {
      const response = await deviceClient.update(
        ctx.params.deviceId,
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
