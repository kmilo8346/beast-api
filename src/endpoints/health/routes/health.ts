import Router, { IMiddleware } from 'koa-router';
import Joi from '@hapi/joi';

export default (router: Router) => {
  router.post('/health', async (ctx) => {
    try {
      const response = 'Api is running !!';
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
