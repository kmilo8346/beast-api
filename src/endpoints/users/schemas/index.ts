import Joi from '@hapi/joi';
import { PlaceFactory } from '../../../schemas';

export const CreateUserFactory = (optional = false) => {
  const schema = Joi.object().keys({
    id: Joi.string().optional(),
    email: Joi.string().email().allow('').optional(),
    email_verified: Joi.boolean().optional(),
    first_name: Joi.string().optional(),
    last_name: Joi.string().allow('').optional(),
    photo_url: Joi.string().allow('').optional(),
    phone: Joi.string().optional(),
    phone_verified: Joi.boolean().optional(),
    current_address: Joi.string().optional(),
    addresses: Joi.array().items(PlaceFactory()).optional(),
    current_store: Joi.string().allow(null).optional(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(
    [
      'id',
      'email',
      'email_verified',
      'first_name',
      'last_name',
      'photo_url',
      'phone',
      'phone_verified',
      'current_address',
      'addresses',
      'current_store',
    ],
    (mySchema) => mySchema.optional(),
  );
};

export const UserFactory = (optional = false) => {
  const schema = CreateUserFactory(optional).keys({
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
