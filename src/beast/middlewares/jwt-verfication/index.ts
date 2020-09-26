import Koa from 'koa';
import lodash from 'lodash';

import firebase from '../../clients/firebase';

interface Config {
  skip?: string[];
}

export default (config: Config) => async (
  ctx: Koa.Context,
  next: () => Promise<any>,
) => {
  if (lodash.find(config.skip || [], (path) => path === ctx.path)) {
    await next();
    return;
  }

  // TODO: throw correct errors
  const [type, token] = (ctx.headers.authorization || '').split(' ');
  const user = await firebase.auth().verifyIdToken(token);
  ctx.state.user = user;
  await next();
};
