import Router from 'koa-router';

import create from './create';

const router = new Router({ prefix: '/shops' });

// register routes
create(router);

export default router;
