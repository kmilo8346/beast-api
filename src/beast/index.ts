import Koa from 'koa';
import koaBody from 'koa-body';
import koaJson from 'koa-json';

import config from './config';
import logger from './logger';

import productsRouter from '../endpoints/products/routes';

const app = new Koa();

app.use(koaJson());
app.use(koaBody());

app.use(productsRouter.routes()).use(productsRouter.allowedMethods());

app.on('error', (err) => {
  logger.error('Beast Server error', err);
});

export const liftServer = () => {
  const port = config.getNumber('BEAST_PORT', 3000);
  app.listen(port);
  logger.info(`Starting Beast Server in port ${port}`);
};

export default app;
