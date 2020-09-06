import Router from 'koa-router';

import ordersRouter from '../orders/routes';

const router = new Router({ prefix: '/long-polling' });

// register routes
router.use(ordersRouter.routes(), ordersRouter.allowedMethods());

export default router;
