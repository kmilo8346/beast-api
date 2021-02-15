import Error from 'verror';
import lodash from 'lodash';
import Router, { IMiddleware } from 'koa-router';

import { CreateDeviceFactory } from '../schemas';
import { CreateParamsFactory } from '../../../schemas';
import deviceClient from '../clients/device-client';

const schema = CreateParamsFactory(CreateDeviceFactory().required());

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const validProduct = await schema.validateAsync(ctx.request.body, {
      stripUnknown: true,
    });
    // set formatted body
    ctx.request.body = validProduct;
    await next();
  } catch (error) {
    ctx.throw(400, error);
  }
};

export default (router: Router) => {
  router.post('/', validate, async (ctx) => {
    try {
      const response = await deviceClient.create(ctx.request.body);
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
