import Router from 'koa-router';

import search from './search';
import create from './create';
import update from './update';
import deleteRoute from './delete';

const router = new Router({ prefix: '/stores/:storeId/products' });

// register routes
search(router);
create(router);
update(router);
deleteRoute(router);

export default router;
