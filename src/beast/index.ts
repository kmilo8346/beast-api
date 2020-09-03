import http from 'http';
import Koa from 'koa';
import koaBody from 'koa-body';
import koaJson from 'koa-json';
import koaQS from 'koa-qs';
import conditional from 'koa-conditional-get';
import etag from 'koa-etag';
import koaPinoLogger from 'koa-pino-logger';

import init from './init';
import config from './config';
import logger from './logger';
import io from './clients/socket.io';
import health from './middlewares/health';
import JwtVerification from './middlewares/jwt-verfication';

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
// socket logic
import '../socket';

const prefix = '[beast server]';
const app = new Koa();
koaQS(app);

app.use(koaJson());
app.use(koaBody());
// app.use(koaPinoLogger());
app.use(conditional());
app.use(etag());
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

export const initServer = async () => {
  await init();
};

export const liftServer = () => {
  const port = config.getNumber('PORT', 3000);
  const server = http.createServer(app.callback());
  io.initialize(server);
  server.listen(port);
  logger.info(`${prefix} Started in port ${port}`);
};

export default app;
