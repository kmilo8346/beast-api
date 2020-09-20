import Router from 'koa-router';

import get from './get';

const router = new Router({ prefix: '/mercadopago/users' });

// register routes
get(router);

export default router;
