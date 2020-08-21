import Router, { IMiddleware } from 'koa-router';
import Error from 'verror';
import lodash from 'lodash';

import { UpdateParamsFactory } from '../../../schemas';
import { WidgetFactory } from '../schemas';
import widgetClient from '../clients/widget-client';

const schema = UpdateParamsFactory(WidgetFactory());

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const body = await schema.validateAsync(ctx.request.body, {});

    // set formatted body
    ctx.request.body = body;
    await next();
  } catch (error) {
    ctx.throw(400, error);
  }
};

export default (router: Router) => {
  router.put('/:widgetId', validate, async (ctx) => {
    try {
      const response = await widgetClient.update(
        ctx.params.widgetId,
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
