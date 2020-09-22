import Koa from 'koa';
import qs from 'qs';

export default (): ((
  ctx: Koa.Context,
  next: () => Promise<any>,
) => Promise<any>) => async (ctx, next) => {
  ctx.state.query = qs.parse(decodeURIComponent(ctx.querystring));
  await next();
};
