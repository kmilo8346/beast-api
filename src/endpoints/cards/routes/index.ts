import Router from 'koa-router';

import createRoute from './create';
import deleteRoute from './delete';

const router = new Router({ prefix: '/customers/:customer_id/cards' });

// register routes
createRoute(router);
deleteRoute(router);

export default router;
