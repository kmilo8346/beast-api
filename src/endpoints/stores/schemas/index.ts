/* eslint-disable import/prefer-default-export */
import Joi from '@hapi/joi';

export const SearchFiltersFactory = () =>
  Joi.object().keys({
    user: Joi.string().optional(),
    position: Joi.array().items(Joi.number()).length(2),
  });
