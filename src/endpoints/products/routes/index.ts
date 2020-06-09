import Router from 'koa-router';

import search from './search';

const router = new Router({ prefix: '/products' });

// register routes
search(router);

export default router;
