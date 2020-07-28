/* eslint-disable import/prefer-default-export */
import Joi from '@hapi/joi';

export const SearchFiltersFactory = () =>
  Joi.object().keys({
    idempotency: Joi.string().optional(),
    store: Joi.string().optional(),
    customer: Joi.string().optional(),
    status: Joi.array().items(Joi.string()).optional(),
  });
