import Router from 'koa-router';

import autocomplete from './autocomplete';
import details from './details';

const router = new Router({ prefix: '/google/places' });

// register routes
autocomplete(router);
details(router);

export default router;
