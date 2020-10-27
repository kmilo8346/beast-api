import Router from 'koa-router';

import startRoute from './start';

const router = new Router({ prefix: '/mercadopago/checkout' });

// register routes
startRoute(router);

export default router;
