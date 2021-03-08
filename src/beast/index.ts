import Koa from 'koa';
import koaBody from 'koa-body';
import koaJson from 'koa-json';
import koaConditional from 'koa-conditional-get';
import koaEtag from 'koa-etag';
import cors from '@koa/cors';
// import koaPinoLogger from 'koa-pino-logger';

import config from './config';
import logger from './logger';
import koaQs from './middlewares/qs';
import koaHealth from './middlewares/health';
import koaJwtVerification from './middlewares/jwt-verfication';

// google
import googlePlacesRouter from '../endpoints/google/places/routes';
import googleGeocodeRouter from '../endpoints/google/geocode/routes';
// beast
import devicesRouter from '../endpoints/devices/routes';
import usersRouter from '../endpoints/users/routes';
import storesRouter from '../endpoints/stores/routes';
import productsRouter from '../endpoints/products/routes';
import storeProductsRouter from '../endpoints/store-products/routes';
import phonesRouter from '../endpoints/phones/routes';
import widgetsRouter from '../endpoints/widgets/routes';
import notificationsRouter from '../endpoints/notifications/routes';

const prefix = '[beast server]';
const app = new Koa();

app.use(cors());
app.use(koaQs());
app.use(koaJson());
app.use(koaBody());
// app.use(koaPinoLogger());
app.use(koaConditional());
app.use(koaEtag());
app.use(
  koaHealth({
    labels: {
      github_run_number: config.get('GITHUB_RUN_NUMBER', ''),
      github_sha: config.get('GITHUB_SHA', ''),
      gae_application: config.get('GAE_APPLICATION', ''),
      gae_deployment_id: config.get('GAE_DEPLOYMENT_ID', ''),
      gae_service: config.get('GAE_SERVICE', ''),
      gae_version: config.get('GAE_VERSION', ''),
    },
  }),
);
app.use(
  koaJwtVerification({
    skip: [
      '/mercadopago/authorization',
      '/mercadopago/authorization/callback',
      '/mercadopago/checkout/callback',
    ],
  }),
);

// google
app.use(googlePlacesRouter.routes()).use(googlePlacesRouter.allowedMethods());
app.use(googleGeocodeRouter.routes()).use(googleGeocodeRouter.allowedMethods());
// beast
app.use(devicesRouter.routes()).use(devicesRouter.allowedMethods());
app.use(usersRouter.routes()).use(usersRouter.allowedMethods());
app.use(storesRouter.routes()).use(storesRouter.allowedMethods());
app.use(productsRouter.routes()).use(productsRouter.allowedMethods());
app.use(storeProductsRouter.routes()).use(storeProductsRouter.allowedMethods());
app.use(phonesRouter.routes()).use(phonesRouter.allowedMethods());
app.use(widgetsRouter.routes()).use(widgetsRouter.allowedMethods());
app.use(notificationsRouter.routes()).use(notificationsRouter.allowedMethods());

app.on('error', (err) => {
  logger.error({ err });
});

export const liftServer = () => {
  const port = config.getNumber('PORT', 3000);
  app.listen(port);
  logger.info(`${prefix} Started in port ${port}`);
};

export default app;
