import Router from 'koa-router';

import health from './health';

const router = new Router({ prefix: '/health' });

// register routes
health(router);

export default router;
