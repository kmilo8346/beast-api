import Koa from 'koa';
import koaBody from 'koa-body';
import koaJson from 'koa-json';

import config from './config';
import logger from './logger';
import JwtVerification from './middlewares/jwt-verfication';
import health from './middlewares/health';

// TODO: dynamic load
import customersRouter from '../endpoints/customers/routes';
import cardsRouter from '../endpoints/cards/routes';
import productsRouter from '../endpoints/products/routes';
import storesRouter from '../endpoints/stores/routes';
import paymentMethodsRouter from '../endpoints/payment-methods/routes';
import installmentsRouter from '../endpoints/installments/routes';
import cardTokensRouter from '../endpoints/card-tokens/routes';
import googlePlacesRouter from '../endpoints/google/places/routes';
import phonesRouter from '../endpoints/phones/routes';

const app = new Koa();

app.use(koaJson());
app.use(koaBody());
app.use(health());
app.use(JwtVerification());

app.use(customersRouter.routes()).use(customersRouter.allowedMethods());
app.use(cardsRouter.routes()).use(cardsRouter.allowedMethods());
app.use(productsRouter.routes()).use(productsRouter.allowedMethods());
app.use(storesRouter.routes()).use(storesRouter.allowedMethods());
app
  .use(paymentMethodsRouter.routes())
  .use(paymentMethodsRouter.allowedMethods());
app.use(installmentsRouter.routes()).use(installmentsRouter.allowedMethods());
app.use(cardTokensRouter.routes()).use(cardTokensRouter.allowedMethods());
app.use(googlePlacesRouter.routes()).use(googlePlacesRouter.allowedMethods());
app.use(phonesRouter.routes()).use(phonesRouter.allowedMethods());

app.on('error', (err) => {
  logger.error(err);
});

export const liftServer = () => {
  const port = config.getNumber('BEAST_PORT', 3000);
  app.listen(port);
  logger.info(`Starting Beast Server in port ${port}`);
};

export default app;
