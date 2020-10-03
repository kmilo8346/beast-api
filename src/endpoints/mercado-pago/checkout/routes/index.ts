import Router from 'koa-router';

import redirect from './redirect';

const router = new Router({ prefix: '/mercadopago/checkout' });

// register routes
redirect(router);

export default router;
