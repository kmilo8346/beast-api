/* eslint-disable import/prefer-default-export */
import Joi from '@hapi/joi';
import { LocationFactory } from '../../../schemas';

export const SearchFiltersFactory = () =>
  Joi.object().keys({
    user: Joi.string().optional(),
    location: LocationFactory().optional(),
  });
