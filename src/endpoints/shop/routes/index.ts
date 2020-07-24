import Router from 'koa-router';

import create from './create';

const router = new Router({ prefix: '/shop' });

// register routes
create(router);

export default router;
