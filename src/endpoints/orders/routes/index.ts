import Router from 'koa-router';

import search from './search';
import confirm from './confirm';
import deliver from './deliver';

const router = new Router({ prefix: '/orders' });

// register routes
search(router);
confirm(router);
deliver(router);

export default router;
