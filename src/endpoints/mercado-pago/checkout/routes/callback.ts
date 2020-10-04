import Router from 'koa-router';
import { URL } from 'url';
import Error from 'verror';

import logger from '../../../../beast/logger';

const prefix = '[mercadopago checkout redirect route]';

export default (router: Router) => {
  router.get('/callback', async (ctx) => {
    try {
      logger.info({ query: ctx.state.query }, '[debug redirect]');
      const beastRedirect = ctx.state.query.beast_redirect;
      if (!beastRedirect) {
        throw new Error(
          { info: { query: ctx.state.query } },
          `${prefix} Beast redirect must be defined`,
        );
      }

      let status = '';
      switch (ctx.state.query.collection_status) {
        case 'null':
          status = '';
          break;
        case 'pending':
          status = 'pending';
          break;
        case 'in_process':
          status = 'in_process';
          break;
        case 'approved':
        case undefined: // ok redirect with webpay debito
          status = 'approved';
          break;
        case 'rejected':
          status = 'rejected';
          break;
        default:
          logger.error(
            { query: ctx.state.query },
            `${prefix} Collection status not mapped`,
          );
          status = 'not_mapped';
          break;
      }
      const url = new URL(beastRedirect);
      url.searchParams.append('status', status);
      ctx.redirect(url.toString());
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
