import Joi, { ObjectSchema } from '@hapi/joi';

import { LocationFactory, SearchParamsFactory } from '../../../schemas';

export const CreateWidgetFactory = (optional = false) => {
  const schema = Joi.object({
    type: Joi.string()
      .valid('store_horizontal_list', 'store_vertical_list')
      .required(),
    tags: Joi.array().items(Joi.string()).min(1).required(),
    order: Joi.number().required(),
    instructions: Joi.alternatives()
      .conditional('type', {
        switch: [
          {
            is: 'store_horizontal_list',
            then: Joi.object({
              title: Joi.string().required(),
              search: SearchParamsFactory(Joi.object()).required(),
            }),
          },
          {
            is: 'store_vertical_list',
            then: Joi.object({
              search: SearchParamsFactory(Joi.object()).required(),
            }),
          },
        ],
      })
      .required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(['type', 'tags', 'order', 'instructions'], (mySchema) =>
    mySchema.optional(),
  );
};

export const WidgetFactory = (optional = false) => {
  const schema = CreateWidgetFactory(optional).keys({
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

export const SearchFiltersFactory = () =>
  Joi.object()
    .keys({
      tags: Joi.array().items(Joi.string()).min(1).optional(),
    })
    .default({});

export const RenderParamsFactory = (filters: ObjectSchema) =>
  SearchParamsFactory(filters).keys({
    context: Joi.object()
      .keys({
        location: LocationFactory().optional(),
        store_address: Joi.string().optional(),
      })
      .required(),
  });
