import Router from 'koa-router';

import generateSafeURL from './generate-safe-url';

const router = new Router({ prefix: '/mercadopago/authorization' });

// register routes
generateSafeURL(router);

export default router;
