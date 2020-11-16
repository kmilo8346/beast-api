import Router from 'koa-router';

import geocodeRoute from './geocode';

const router = new Router({ prefix: '/google/geocode' });

// register routes
geocodeRoute(router);

export default router;
