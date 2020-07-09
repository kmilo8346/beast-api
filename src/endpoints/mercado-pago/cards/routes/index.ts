import Router from 'koa-router';

import createRoute from './create';

const router = new Router({
  prefix: '/mercadopago/customers/:customerId/cards',
});

// register routes
createRoute(router);

export default router;
