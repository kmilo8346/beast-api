import Router from 'koa-router';

import callback from './callback';

const router = new Router({ prefix: '/mercadopago/checkout' });

// register routes
callback(router);

export default router;
