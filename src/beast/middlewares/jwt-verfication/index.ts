import Koa from 'koa';

import firebase from '../../clients/firebase';

export default (): ((
  ctx: Koa.Context,
  next: () => Promise<any>,
) => Promise<any>) => async (ctx, next) => {
  // TODO: throw correct errors
  const [type, token] = (ctx.headers.authorization || '').split(' ');
  const user = await firebase.auth().verifyIdToken(token);
  ctx.state.user = user;
  await next();
};
