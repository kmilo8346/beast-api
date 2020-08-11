import Joi from '@hapi/joi';

export const SearchFiltersFactory = () =>
  Joi.object().keys({
    user: Joi.string().optional(),
  });

export const CreateDeviceFactory = (optional = false) => {
  const schema = Joi.object({
    token: Joi.string().required(),
    user_id: Joi.string().required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(['token', 'user_id'], (mySchema) => mySchema.optional());
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
