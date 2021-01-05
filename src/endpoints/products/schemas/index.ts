import Joi from '@hapi/joi';

import { LocationFactory } from '../../../schemas';

export const SearchFiltersFactory = () =>
  Joi.object()
    .keys({
      enabled: Joi.boolean().optional(),
      location: LocationFactory().optional(),
      store_enabled: Joi.boolean().optional(),
      must_not_id: Joi.string().optional(),
    })
    .default({});
