/* eslint-disable import/prefer-default-export */
import Joi from '@hapi/joi';

export const SearchFiltersFactory = () =>
  Joi.object().keys({
    enabled: Joi.boolean().optional(),
  });
