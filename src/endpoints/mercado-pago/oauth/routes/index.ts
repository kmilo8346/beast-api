import Router from 'koa-router';

import token from './token';

const router = new Router({ prefix: '/mercadopago/oauth' });

// register routes
token(router);

export default router;
