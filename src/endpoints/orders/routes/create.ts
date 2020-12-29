import Router, { IMiddleware } from 'koa-router';
import moment from 'moment-timezone';

import logger from '../../../beast/logger';
import { CreateOrderFactory } from '../schemas';
import orderClient from '../clients/order-client';
import { CreateParamsFactory } from '../../../schemas';
import storeClient from '../../stores/clients/store-client';
import productClient from '../../products/clients/product-client';
import { CreateOrder, CreateParams, Product, Store } from '../../../types';

const prefix = '[create order route]';
const schema = CreateParamsFactory(CreateOrderFactory().required());

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const body = await schema.validateAsync(ctx.request.body, {
      stripUnknown: true,
    });
    // set formatted body
    ctx.request.body = body;
    await next();
  } catch (error) {
    ctx.throw(400, error);
  }
};

const isStoreOpen = (store: Store) => {
  const date = moment().tz('America/Santiago');
  let day = `${date.day()}`;
  if (day === '0') {
    day = '7';
  }
  const minutes = date.minutes();
  const time = parseInt(
    `${date.hour()}${minutes < 10 ? `0${minutes}` : minutes}`,
    10,
  );

  const match = store.opening_hours.find((oh) => oh.day === day);
  if (!match) {
    logger.error({ store, day }, `${prefix} Day not found in opening hours`);
    return false;
  }
  const hours = match.hours || [{ open: match.open, close: match.close }];
  return hours.some((h) => time >= h.open && time < h.close);
};

const checking: IMiddleware = async (ctx, next): Promise<void> => {
  const params = ctx.request.body as CreateParams<CreateOrder>;
  let store: Store | undefined;
  let products: Product[] = [];
  try {
    const results = await Promise.all([
      storeClient.get(params.body.transaction.shopping_cart.store.id),
      productClient.search(params.body.transaction.shopping_cart.store.id, {
        filters: {
          ids: params.body.transaction.shopping_cart.items.map((i) => i.id),
        },
        from: 0,
        size: 100,
      }),
    ]);
    store = results[0];
    products = results[1].hits;
  } catch (error) {
    ctx.throw(500, error);
  }

  if (store && !store.enabled) {
    ctx.throw(
      400,
      JSON.stringify({ reason: 'SHOP_DISABLED', meta_data: { id: store.id } }),
    );
  }

  if (store && !isStoreOpen(store)) {
    ctx.throw(
      400,
      JSON.stringify({ reason: 'SHOP_CLOSED', meta_data: { id: store.id } }),
    );
  }

  const productsNotAvailables = products.reduce<Product[]>(
    (notAvailable, product) => {
      if (!product.enabled) {
        return [...notAvailable, product];
      }
      return notAvailable;
    },
    [],
  );
  if (productsNotAvailables.length) {
    ctx.throw(
      400,
      JSON.stringify({
        reason: 'PRODUCTS_NOT_AVAILABLE',
        meta_data: { products: productsNotAvailables },
      }),
    );
  }

  await next();
};

export default (router: Router) => {
  router.post('/', validate, checking, async (ctx) => {
    try {
      const response = await orderClient.create(ctx.request.body);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
