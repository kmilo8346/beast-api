import Joi from '@hapi/joi';
import { PlaceFactory } from '../../../schemas';

export const CreateUserFactory = () => {
  const schema = Joi.alternatives().try(
    {
      id: Joi.string().required(),
      current_address: Joi.string().required(),
      addresses: Joi.array().min(1).items(PlaceFactory()).required(),
    },
    {
      id: Joi.string().required(),
      email: Joi.string().email().required(),
      first_name: Joi.string().required(),
      last_name: Joi.string().allow('').optional(),
      photo_url: Joi.string().required(),
      phone: Joi.string().required(),
      phone_verified: Joi.boolean().required(),
      current_address: Joi.string().required(),
      addresses: Joi.array().items(PlaceFactory()).required(),
    },
  );
  return schema;
};

export const UserFactory = () => {
  const schema = Joi.alternatives().try(
    {
      current_address: Joi.string().optional(),
      addresses: Joi.array().min(1).items(PlaceFactory()).optional(),
    },
    {
      email: Joi.string().email().optional(),
      first_name: Joi.string().optional(),
      last_name: Joi.string().optional(),
      photo_url: Joi.string().optional(),
      phone: Joi.string().optional(),
      phone_verified: Joi.boolean().optional(),
      current_address: Joi.string().optional(),
      addresses: Joi.array().min(1).items(PlaceFactory()).optional(),
      current_store: Joi.string().optional(),
    },
  );

  return schema;
};
