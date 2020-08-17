import Router from 'koa-router';

import getRoute from './get';
import searchRoute from './search';
import createRoute from './create';
import updateRoute from './update';

const router = new Router({ prefix: '/stores' });

// register routes
getRoute(router);
searchRoute(router);
createRoute(router);
updateRoute(router);

export default router;
