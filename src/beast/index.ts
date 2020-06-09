import Koa from 'koa';
import koaBody from 'koa-body';
import koaJson from 'koa-json';
import config from './config';

import productsRouter from '../endpoints/products/routes';

const app = new Koa();

app.use(koaJson());
app.use(koaBody());

app.use(productsRouter.routes()).use(productsRouter.allowedMethods());

export const liftServer = () => {
  app.listen(config.get('BEAST_PORT'));
};

export default app;
