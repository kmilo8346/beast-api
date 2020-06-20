import Router from 'koa-router';

import createRoute from './create';
import updateRoute from './update';

const router = new Router({ prefix: '/customers' });

// register routes
createRoute(router);
updateRoute(router);

export default router;
