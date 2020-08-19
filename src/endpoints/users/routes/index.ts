import Router from 'koa-router';

import getRoute from './get';
import createRoute from './create';
import updateRoute from './update';
import deleteRoute from './delete';

const router = new Router({ prefix: '/users' });

// register routes
getRoute(router);
createRoute(router);
updateRoute(router);
deleteRoute(router);

export default router;
