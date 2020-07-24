import Router, { IMiddleware } from 'koa-router';
import Joi from '@hapi/joi';

import cardTokenClient from '../clients/card-token-client';

const schema = Joi.object({
  body: Joi.alternatives()
    .try(
      {
        card_number: Joi.string().required(),
        security_code: Joi.string().required(),
        expiration_month: Joi.number().required(),
        expiration_year: Joi.number().required(),
        cardholder: {
          name: Joi.string().required(),
          identification: {
            type: Joi.string().required(),
            number: Joi.string().required(),
          },
        },
      },
      {
        security_code: Joi.string().required(),
        card_id: Joi.string().required(),
      },
    )
    .required(),

  source: Joi.array().items(Joi.string()).optional(),
});

const validate: IMiddleware = async (ctx, next): Promise<void> => {
  try {
    const value = await schema.validateAsync(ctx.request.body);
    // set formatted body
    ctx.request.body = value;
    await next();
  } catch (error) {
    ctx.throw(400, error);
  }
};

export default (router: Router) => {
  router.post('/', validate, async (ctx) => {
    try {
      const response = await cardTokenClient.create(ctx.request.body);
      ctx.body = response;
    } catch (error) {
      ctx.throw(500, error);
    }
  });
};
