import Joi from '@hapi/joi';

import { LocationFactory } from '../../../schemas';

export const SearchFiltersFactory = () =>
  Joi.object().keys({
    store: Joi.string().optional(),
    enabled: Joi.boolean().optional(),
    must_not_id: Joi.string().optional(),
    location: LocationFactory().optional(),
    store_open: Joi.boolean().optional(),
    store_address: Joi.string().optional(),
    store_enabled: Joi.boolean().optional(),
    must_not_store_address: Joi.string().optional(),
    stats_number_of_times_in_order_gte: Joi.number().optional(),
  });
