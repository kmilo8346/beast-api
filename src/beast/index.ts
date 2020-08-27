import Koa from 'koa';
import koaBody from 'koa-body';
import koaJson from 'koa-json';
import koaPinoLogger from 'koa-pino-logger';

import config from './config';
import logger from './logger';
import JwtVerification from './middlewares/jwt-verfication';
import health from './middlewares/health';

// mercado pago
import oauthRouter from '../endpoints/mercado-pago/oauth/routes';
// google
import googlePlacesRouter from '../endpoints/google/places/routes';
// beast
import devicesRouter from '../endpoints/devices/routes';
import usersRouter from '../endpoints/users/routes';
import phonesRouter from '../endpoints/phones/routes';
import widgetsRouter from '../endpoints/widgets/routes';
import storesRouter from '../endpoints/stores/routes';
import productsRouter from '../endpoints/products/routes';
import paymentsRouter from '../endpoints/payments/routes';
import ordersRouter from '../endpoints/orders/routes';

const app = new Koa();

app.use(koaJson());
app.use(koaBody());
app.use(koaPinoLogger());
app.use(
  health({
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
app.use(JwtVerification());

// mercado pago
app.use(oauthRouter.routes()).use(oauthRouter.allowedMethods());
// google
app.use(googlePlacesRouter.routes()).use(googlePlacesRouter.allowedMethods());
// beast
app.use(devicesRouter.routes()).use(devicesRouter.allowedMethods());
app.use(usersRouter.routes()).use(usersRouter.allowedMethods());
app.use(phonesRouter.routes()).use(phonesRouter.allowedMethods());
app.use(widgetsRouter.routes()).use(widgetsRouter.allowedMethods());
app.use(storesRouter.routes()).use(storesRouter.allowedMethods());
app.use(productsRouter.routes()).use(productsRouter.allowedMethods());
app.use(paymentsRouter.routes()).use(paymentsRouter.allowedMethods());
app.use(ordersRouter.routes()).use(ordersRouter.allowedMethods());

app.on('error', (err) => {
  logger.error({ err });
});

export const liftServer = () => {
  const port = config.getNumber('PORT', 3000);
  app.listen(port);
  logger.info(`Starting Beast Server in port ${port}`);
};

export default app;
