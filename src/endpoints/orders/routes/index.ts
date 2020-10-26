import Router from 'koa-router';

import getRoute from './get';
import searchRoute from './search';
import createRoute from './create';

const router = new Router({ prefix: '/orders' });

// register routes
getRoute(router);
searchRoute(router);
createRoute(router);

export default router;
