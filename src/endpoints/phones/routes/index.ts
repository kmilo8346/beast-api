import Router from 'koa-router';

import codeRoute from './code';

const router = new Router({ prefix: '/phones' });

// register routes
codeRoute(router);

export default router;
