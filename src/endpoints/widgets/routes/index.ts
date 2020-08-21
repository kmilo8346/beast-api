import Router from 'koa-router';

import searchRoute from './search';
import createRoute from './create';
import updateRoute from './update';
import deleteRoute from './delete';
import computeRoute from './compute';

const router = new Router({ prefix: '/widgets' });

// register routes
searchRoute(router);
createRoute(router);
updateRoute(router);
deleteRoute(router);
computeRoute(router);

export default router;
