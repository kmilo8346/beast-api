import Router from 'koa-router';

import createRoute from './create';

const router = new Router({ prefix: '/customers' });

// register routes
createRoute(router);

export default router;
