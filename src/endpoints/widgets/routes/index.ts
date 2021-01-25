import Router from 'koa-router';

import searchRoute from './search';
import createRoute from './create';
import updateRoute from './update';
import deleteRoute from './delete';
import renderRoute from './render';

const router = new Router({ prefix: '/widgets' });

// register routes
searchRoute(router);
createRoute(router);
updateRoute(router);
deleteRoute(router);
renderRoute(router);

export default router;
