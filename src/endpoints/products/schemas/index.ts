import Joi from '@hapi/joi';

export const CreateProductFactory = (optional = false) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    images: Joi.array().items(Joi.string()).required(),
    price: Joi.number().required(),
    brand: Joi.string().optional().allow(''),
    tags: Joi.array().items(Joi.string()).optional(),
    enabled: Joi.boolean().required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(
    ['name', 'description', 'images', 'price', 'brand', 'tags', 'enabled'],
    (mySchema) => mySchema.optional(),
  );
};

export const ProductFactory = (optional = false) => {
  const schema = CreateProductFactory(optional).keys({
    id: Joi.string().required(),
    store: Joi.string().required(),
    created_at: Joi.date().required(),
    updated_at: Joi.date().required(),
  });

  if (!optional) {
    return schema;
  }
  return schema.fork(['id', 'store', 'created_at', 'updated_at'], (mySchema) =>
    mySchema.optional(),
  );
};

export const SearchFiltersFactory = () =>
  Joi.object().keys({
    enabled: Joi.boolean().optional(),
  });
