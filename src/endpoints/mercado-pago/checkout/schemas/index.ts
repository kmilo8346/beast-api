import Joi from '@hapi/joi';
import {
  AddressPropFactory,
  PaymentProviderFactory,
} from '../../../../schemas';

export const CreateCheckoutFactory = () =>
  Joi.object({
    customer: Joi.object({
      email: Joi.string().email().required(),
      first_name: Joi.string().required(),
      last_name: Joi.string().allow('').optional(),
      phone: Joi.string().required(),
    }).required(),
    transaction: Joi.object({
      currency: Joi.string().required(),
      delivery_address: Joi.object({
        street_number: AddressPropFactory(false).required(),
        route: AddressPropFactory(false).required(),
      }).required(),
      store: Joi.object({
        name: Joi.string().required(),
        payment_provider: PaymentProviderFactory(false).optional(),
      }).required(),
      amount: Joi.number().required(),
    }).required(),
  }).required();
