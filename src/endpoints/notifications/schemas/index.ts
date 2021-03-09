import Joi from '@hapi/joi';

export const CreateNotificationFactory = () =>
  Joi.object({
    reference: Joi.string().optional(),
    filters: Joi.object({
      user: Joi.string().optional(),
      area: Joi.object({
        type: Joi.string().valid('circle').default('circle'),
        radius: Joi.string().required(),
        coordinates: Joi.array().items(Joi.number()).required(),
      }).optional(),
      app_version_gte: Joi.string().optional(),
    }).optional(),
    message: Joi.object({
      title: Joi.string().required(),
      body: Joi.string().required(),
      data: Joi.object({
        navigate: Joi.object({
          name: Joi.string().valid('Product', 'Store').required(),
          params: Joi.alternatives()
            .conditional('name', {
              switch: [
                {
                  is: 'Product',
                  then: Joi.object({
                    product: Joi.string().required(),
                  }),
                },
                {
                  is: 'Store',
                  then: Joi.object({
                    store: Joi.string().required(),
                  }),
                },
              ],
            })
            .required(),
        }).optional(),
      }).optional(),
    }).required(),
    attribution: Joi.object({
      utm_source: Joi.string().required(),
      utm_medium: Joi.string().required(),
      utm_campaign: Joi.string().required(),
      utm_term: Joi.string().optional(),
      utm_content: Joi.string().optional(),
    }).optional(),
  });

export const SearchFiltersFactory = () => Joi.object().keys({}).default({});
