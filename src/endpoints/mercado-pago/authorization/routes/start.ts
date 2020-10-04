import Router from 'koa-router';

import config from '../../../../beast/config';

export default (router: Router) => {
  router.get('/', async (ctx) => {
    try {
      ctx.redirect(
        `${config.get(
          'MERCADO_PAGO_AUTH_CLOSE_SESSION_URL',
        )}${encodeURIComponent(
          `${config.get(
            'MERCADO_PAGO_AUTH_URL',
          )}/authorization?client_id=${config.get(
            'MERCADO_PAGO_CLIENT_ID',
          )}&response_type=code&platform_id=mp&state=${
            ctx.state.query.redirect
          }&redirect_uri=${config.get('MERCADO_PAGO_AUTH_REDIRECT_URI')}`,
        )}`,
      );
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
