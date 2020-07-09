import Router from 'koa-router';

import registerSearchRoute from './search';

const router = new Router({ prefix: '/mercadopago/payment-methods' });

// register routes
registerSearchRoute(router);

export default router;
