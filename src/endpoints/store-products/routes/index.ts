import Router from 'koa-router';

import searchRoute from './search';

const router = new Router({ prefix: '/storeproducts' });

// register routes
searchRoute(router);

export default router;
