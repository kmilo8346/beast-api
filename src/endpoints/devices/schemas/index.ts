import Joi from '@hapi/joi';

import { LocationFactory } from '../../../schemas';

export const SearchFiltersFactory = () =>
  Joi.object().keys({
    user: Joi.string().optional(),
    area: Joi.object({
      type: Joi.string().valid('circle').default('circle'),
      radius: Joi.string().required(),
      coordinates: Joi.array().items(Joi.number()).required(),
    }).optional(),
    address: Joi.string().optional(),
    token_exists: Joi.boolean().optional(),
    app_version_gte: Joi.string().optional(),
    must_not_address: Joi.string().optional(),
  });

export const CreateDeviceFactory = (optional = false) => {
  const schema = Joi.object({
    id: Joi.string().optional(),
    platform: Joi.string().required(),
    platform_version: Joi.string().required(),
    app_version: Joi.string().allow(null).optional(),
    app_build_version: Joi.string().allow(null).optional(),
    token: Joi.string().allow(null).optional(),
    user_id: Joi.string().allow(null).optional(),
    user_location: LocationFactory().allow(null).optional(),
    user_current_store: Joi.string().allow(null).optional(),
    user_current_address: Joi.string().allow(null).optional(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(
    [
      'platform',
      'platform_version',
      'app_version',
      'app_build_version',
      'token',
      'user_id',
      'user_location',
      'user_current_store',
    ],
    (mySchema) => mySchema.optional(),
  );
};

export const DeviceFactory = (optional = false) => {
  const schema = CreateDeviceFactory(optional).keys({
    id: Joi.string().required(),
    created_at: Joi.date().required(),
    updated_at: Joi.date().required(),
  });

  if (!optional) {
    return schema;
  }
  return schema.fork(['id', 'created_at', 'updated_at'], (mySchema) =>
    mySchema.optional(),
  );
};
