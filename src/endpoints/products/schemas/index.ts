/* eslint-disable import/prefer-default-export */
import Joi from '@hapi/joi';

import { LocationFactory } from '../../../schemas';

export const SearchFiltersFactory = () =>
  Joi.object().keys({
    enabled: Joi.boolean().optional(),
    location: LocationFactory().optional(),
    store_open: Joi.boolean().optional(),
    store_enabled: Joi.boolean().optional(),
    must_not_id: Joi.string().optional(),
  });
