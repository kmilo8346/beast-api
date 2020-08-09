import Router from 'koa-router';

import create from './create';

const router = new Router({ prefix: '/payments' });

// register routes
create(router);

export default router;
