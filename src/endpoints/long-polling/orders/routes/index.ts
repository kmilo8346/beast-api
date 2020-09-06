import Router from 'koa-router';

import subscribe from './subscribe';

const router = new Router({ prefix: '/orders' });

// register routes
subscribe(router);

export default router;
