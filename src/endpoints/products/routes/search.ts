// eslint-disable-next-line no-unused-vars
import Router from 'koa-router';

export default (router: Router) => {
  router.get('/search', (ctx) => {
    ctx.body = {
      text: 'search products',
    };
  });
};
