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

// mercado pago
import mpOauthRouter from '../endpoints/mercado-pago/oauth/routes';
import mpUsersRouter from '../endpoints/mercado-pago/users/routes';
import mpAuthRouter from '../endpoints/mercado-pago/authorization/routes';
import mpCheckoutRouter from '../endpoints/mercado-pago/checkout/routes';
// google
import googlePlacesRouter from '../endpoints/google/places/routes';
// beast
import devicesRouter from '../endpoints/devices/routes';
import usersRouter from '../endpoints/users/routes';
import storesRouter from '../endpoints/stores/routes';
import productsRouter from '../endpoints/products/routes';
import ordersRouter from '../endpoints/orders/routes';
import streamsRouter from '../endpoints/streams/routes';

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
      '/streams/orders',
    ],
  }),
);

// mercado pago
app.use(mpOauthRouter.routes()).use(mpOauthRouter.allowedMethods());
app.use(mpUsersRouter.routes()).use(mpUsersRouter.allowedMethods());
app.use(mpAuthRouter.routes()).use(mpAuthRouter.allowedMethods());
app.use(mpCheckoutRouter.routes()).use(mpCheckoutRouter.allowedMethods());
// google
app.use(googlePlacesRouter.routes()).use(googlePlacesRouter.allowedMethods());
// beast
app.use(devicesRouter.routes()).use(devicesRouter.allowedMethods());
app.use(usersRouter.routes()).use(usersRouter.allowedMethods());
app.use(storesRouter.routes()).use(storesRouter.allowedMethods());
app.use(productsRouter.routes()).use(productsRouter.allowedMethods());
app.use(ordersRouter.routes()).use(ordersRouter.allowedMethods());
app.use(streamsRouter.routes()).use(streamsRouter.allowedMethods());

app.on('error', (err) => {
  if (err.code === 'ECONNRESET') {
    logger.warn({ err });
  } else {
    logger.error({ err });
  }
});

export const liftServer = () => {
  const port = config.getNumber('PORT', 3000);
  app.listen(port);
  logger.info(`${prefix} Started in port ${port}`);
};

export default app;
