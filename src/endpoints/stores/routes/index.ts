import Router from 'koa-router';

import search from './search';

const router = new Router({ prefix: '/stores' });

// register routes
search(router);

export default router;
