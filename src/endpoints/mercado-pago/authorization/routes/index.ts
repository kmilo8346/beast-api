import Router from 'koa-router';

import start from './start';
import callback from './callback';

const router = new Router({ prefix: '/mercadopago/authorization' });

// register routes
start(router);
callback(router);

export default router;
