/* eslint-disable import/prefer-default-export */
import Joi from '@hapi/joi';

export const SearchFiltersFactory = () =>
  Joi.object().keys({
    idempotency: Joi.string().optional(),
    store: Joi.string().optional(),
    customer: Joi.string().optional(),
    status: Joi.array().items(Joi.string()).optional(),
  });

const ConfirmationFactory = () =>
  Joi.array().items(
    Joi.alternatives().try(
      {
        type: Joi.string().allow('update').required(),
        id: Joi.string().required(),
        qty_posible: Joi.number().required(),
      },
      {
        type: Joi.string().allow('delete').required(),
        id: Joi.string().required(),
      },
    ),
  );

const ProviderFactory = () =>
  Joi.object().keys({
    confirmation: ConfirmationFactory().required(),
  });

export const ConfirmDataFactory = () =>
  Joi.object().keys({
    provider: ProviderFactory().required(),
  });
