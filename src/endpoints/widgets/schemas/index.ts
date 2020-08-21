import Joi from '@hapi/joi';
import { LocationFactory } from '../../../schemas';

export const CreateWidgetFactory = () =>
  Joi.object({
    type: Joi.string().valid('banner', 'nearby_stores').required(),
    tags: Joi.array().items(Joi.string()).min(1).required(),
    sort: Joi.number().required(),
    // TODO: validate using type, can be Joi when
    instructions: Joi.alternatives()
      .try(
        {
          image: Joi.string().required(),
        },
        {
          title: Joi.string().required(),
          from: Joi.number().required(),
          size: Joi.number().required(),
        },
      )
      .required(),
  });

export const WidgetFactory = () =>
  Joi.object({
    type: Joi.string().valid('banner', 'nearby_stores').optional(),
    tags: Joi.array().items(Joi.string()).min(1).optional(),
    sort: Joi.number().optional(),
    // TODO: validate using type, can be Joi when
    instructions: Joi.alternatives()
      .try(
        {
          image: Joi.string().required(),
        },
        {
          title: Joi.string().required(),
          from: Joi.number().required(),
          size: Joi.number().required(),
        },
      )
      .optional(),
  });

export const SearchFiltersFactory = () =>
  Joi.object().keys({
    tag: Joi.string().optional(),
  });

export const FiltersFactory = () =>
  Joi.object().keys({
    tag: Joi.string().required(),
  });

export const ContextFactory = () =>
  Joi.object().keys({
    location: LocationFactory().required(),
  });

export const ComputeParamsFactory = () =>
  Joi.object({
    filters: FiltersFactory().required(),
    context: ContextFactory().required(),
    from: Joi.number().integer().min(0).default(0),
    size: Joi.number().min(0).max(20).default(10),
  });
