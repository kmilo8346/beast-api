import Koa from 'koa';
import koaBody from 'koa-body';
import koaJson from 'koa-json';

import config from './config';
import logger from './logger';

import productsRouter from '../endpoints/products/routes';
import storesRouter from '../endpoints/stores/routes';
import paymentMethodsRouter from '../endpoints/payment-methods/routes';
import installmentsRouter from '../endpoints/installments/routes';
import googlePlacesRouter from '../endpoints/google/places/routes';

const app = new Koa();

app.use(koaJson());
app.use(koaBody());

app.use(productsRouter.routes()).use(productsRouter.allowedMethods());
app.use(storesRouter.routes()).use(storesRouter.allowedMethods());
app
  .use(paymentMethodsRouter.routes())
  .use(paymentMethodsRouter.allowedMethods());
app.use(installmentsRouter.routes()).use(installmentsRouter.allowedMethods());
app.use(googlePlacesRouter.routes()).use(googlePlacesRouter.allowedMethods());

app.on('error', (err) => {
  logger.error(err);
});

export const liftServer = () => {
  const port = config.getNumber('BEAST_PORT', 3000);
  app.listen(port);
  logger.info(`Starting Beast Server in port ${port}`);
};

export default app;
