import Router from 'koa-router';
import { URL } from 'url';
import Error from 'verror';

const prefix = '[mercadopago auth callback route]';

export default (router: Router) => {
  router.get('/callback', async (ctx) => {
    try {
      const { state, code } = ctx.state.query;
      if (!state) {
        throw new Error(
          { info: { query: ctx.state.query } },
          `${prefix} State must be defined`,
        );
      }

      const redirect = new URL(state);
      if (!code) {
        redirect.searchParams.append('status', 'fail');
        redirect.searchParams.append('message', 'code must be defined');
        ctx.redirect(redirect.toString());
        return;
      }

      redirect.searchParams.append('status', 'ok');
      redirect.searchParams.append('code', code);
      ctx.redirect(redirect.toString());
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
