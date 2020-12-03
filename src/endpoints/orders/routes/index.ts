import Router from 'koa-router';

import getRoute from './get';
import searchRoute from './search';
import createRoute from './create';
import confirmRoute from './confirm';
import deliveryRoute from './delivery';
import cancelRoute from './cancel';

const router = new Router({ prefix: '/orders' });

// register routes
getRoute(router);
searchRoute(router);
createRoute(router);
confirmRoute(router);
deliveryRoute(router);
cancelRoute(router);

export default router;
