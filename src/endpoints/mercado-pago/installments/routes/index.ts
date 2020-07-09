import Router from 'koa-router';

import registerListRoute from './list';

const router = new Router({
  prefix: '/mercadopago/payment-methods/:payment_method_id/installments',
});

// register routes
registerListRoute(router);

export default router;
