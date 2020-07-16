import Router, { IMiddleware } from 'koa-router';

import productClient from '../clients/product-client';
import {
  createCreateParamsSchema,
  createProductSchema,
} from '../../../schemas';

const createParamsSchema = createCreateParamsSchema(createProductSchema());

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const validProduct = await createParamsSchema.validateAsync(
      ctx.request.body,
      { stripUnknown: true },
    );
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
      const response = await productClient.create(
        ctx.params.storeId,
        ctx.request.body,
      );
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
