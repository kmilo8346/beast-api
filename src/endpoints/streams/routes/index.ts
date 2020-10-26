import Router from 'koa-router';

import ordersRoute from './orders';

const router = new Router({ prefix: '/streams' });

// register routes
ordersRoute(router);

export default router;
