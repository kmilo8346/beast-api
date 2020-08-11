import Router from 'koa-router';

import searchRoute from './search';
import createRoute from './create';
import updateRoute from './update';
import deleteRoute from './delete';

const router = new Router({ prefix: '/devices' });

// register routes
searchRoute(router);
createRoute(router);
updateRoute(router);
deleteRoute(router);

export default router;
