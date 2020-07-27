import Koa from 'koa';
import koaBody from 'koa-body';
import koaJson from 'koa-json';

import config from './config';
import logger from './logger';
import JwtVerification from './middlewares/jwt-verfication';
import health from './middlewares/health';

// mercado pago
import customersRouter from '../endpoints/mercado-pago/customers/routes';
import cardsRouter from '../endpoints/mercado-pago/cards/routes';
import paymentMethsRouter from '../endpoints/mercado-pago/payment-methods/routes';
import installmentsRouter from '../endpoints/mercado-pago/installments/routes';
import cardTokensRouter from '../endpoints/mercado-pago/card-tokens/routes';
import oauthRouter from '../endpoints/mercado-pago/oauth/routes';
// google
import googlePlacesRouter from '../endpoints/google/places/routes';
// beast
import phonesRouter from '../endpoints/phones/routes';
import storesRouter from '../endpoints/stores/routes';
import productsRouter from '../endpoints/products/routes';
import shopRouter from '../endpoints/shop/routes';

const app = new Koa();

app.use(koaJson());
app.use(koaBody());
app.use(
  health({
    labels: {
      compilation: config.get('COMPILATION', ''),
      git_sha: config.get('GIT_SHA', ''),
      gae_application: config.get('GAE_APPLICATION', ''),
      gae_deployment_id: config.get('GAE_DEPLOYMENT_ID', ''),
    },
  }),
);
app.use(JwtVerification());

// mercado pago
app.use(customersRouter.routes()).use(customersRouter.allowedMethods());
app.use(cardsRouter.routes()).use(cardsRouter.allowedMethods());
app.use(paymentMethsRouter.routes()).use(paymentMethsRouter.allowedMethods());
app.use(installmentsRouter.routes()).use(installmentsRouter.allowedMethods());
app.use(cardTokensRouter.routes()).use(cardTokensRouter.allowedMethods());
app.use(oauthRouter.routes()).use(oauthRouter.allowedMethods());
// google
app.use(googlePlacesRouter.routes()).use(googlePlacesRouter.allowedMethods());
// beast
app.use(phonesRouter.routes()).use(phonesRouter.allowedMethods());
app.use(storesRouter.routes()).use(storesRouter.allowedMethods());
app.use(productsRouter.routes()).use(productsRouter.allowedMethods());
app.use(shopRouter.routes()).use(shopRouter.allowedMethods());

app.on('error', (err) => {
  logger.error({ err });
});

export const liftServer = () => {
  const port = config.getNumber('PORT', 3000);
  app.listen(port);
  logger.info(`Starting Beast Server in port ${port}`);
};

export default app;
