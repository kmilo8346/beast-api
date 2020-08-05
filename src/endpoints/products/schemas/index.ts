import Joi from '@hapi/joi';

import { StoreFactory } from '../../../schemas';

export const CreateProductFactory = (optional = false) => {
  const schema = Joi.object({
    type: Joi.string().allow('product', 'service').required(),
    name: Joi.string().required(),
    description: Joi.string().required(),
    images: Joi.array().items(Joi.string()).required(),
    price: Joi.number().optional().allow(null), // for product is required
    brand: Joi.string().optional().allow(''),
    tags: Joi.array().items(Joi.string()).optional(),
    enabled: Joi.boolean().required(),
    store: StoreFactory(optional).required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(
    [
      'type',
      'name',
      'description',
      'images',
      'price',
      'brand',
      'tags',
      'store',
    ],
    (mySchema) => mySchema.optional(),
  );
};

export const ProductFactory = (optional = false) => {
  const schema = CreateProductFactory(optional).keys({
    id: Joi.string().allow('CL').required(),
    created_at: Joi.string().allow('CL').required(),
    updated_at: Joi.string().allow('CL').required(),
  });

  if (!optional) {
    return schema;
  }
  return schema.fork(['id', 'created_at', 'updated_at'], (mySchema) =>
    mySchema.optional(),
  );
};
