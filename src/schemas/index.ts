import Joi from '@hapi/joi';

const createPlaceGeometryLocationSchema = (optional = false) => {
  const schema = Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(['lat', 'lng'], (mySchema) => mySchema.optional());
};

const createPlaceGeometrySchema = (optional = false) => {
  const schema = Joi.object({
    location: createPlaceGeometryLocationSchema(optional).required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(['location'], (mySchema) => mySchema.optional());
};

const createAddressPropSchema = (optional = false) => {
  const schema = Joi.object({
    short_name: Joi.string().required(),
    long_name: Joi.string().required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(['short_name', 'long_name'], (mySchema) =>
    mySchema.optional(),
  );
};

const createPlaceSchema = (optional = false) => {
  const schema = Joi.object({
    id: Joi.string().required(),
    url: Joi.string().uri().required(),
    street_number: createAddressPropSchema(optional).required(),
    route: createAddressPropSchema(optional).required(),
    locality: createAddressPropSchema(optional).required(),
    administrative_area_level3: createAddressPropSchema(optional).required(),
    administrative_area_level2: createAddressPropSchema(optional).required(),
    administrative_area_level1: createAddressPropSchema(optional).required(),
    apartment: Joi.string().allow(''),
    geometry: createPlaceGeometrySchema(optional).required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(
    [
      'id',
      'url',
      'street_number',
      'route',
      'locality',
      'administrative_area_level3',
      'administrative_area_level2',
      'administrative_area_level1',
      'apartment',
      'geometry',
    ],
    (mySchema) => mySchema.optional(),
  );
};

const createCircleSchema = (optional = false) => {
  const schema = Joi.object().keys({
    type: Joi.string().required(),
    radius: Joi.string().required(),
    coordinates: Joi.array().items(Joi.number()).required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(['type', 'radius', 'coordinates'], (mySchema) =>
    mySchema.optional(),
  );
};

const createIntegerRangeSchema = (optional = false) => {
  const schema = Joi.object({
    lte: Joi.number(),
    gte: Joi.number(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(['lte', 'gte'], (mySchema) => mySchema.optional());
};

const createDeliveryAreaSchema = (optional = false) => {
  const schema = Joi.object().keys({
    center: createPlaceSchema(optional).required(),
    radius: Joi.string().required(),
    geometry: createCircleSchema(optional).required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(['center', 'radius', 'geometry'], (mySchema) =>
    mySchema.optional(),
  );
};

const createOpeningHoursSchema = (optional = false) => {
  const schema = Joi.array().items(
    Joi.object({
      day: Joi.string().required(), // TODO: 1 - 7
      open: Joi.number().min(0).max(2359).required(),
      close: Joi.number().min(0).max(2359).required(),
    }),
  );
  return schema;
};

const createSellerCredentialsSchema = (optional = false) => {
  const schema = Joi.object({
    access_token: Joi.string().required(),
    expires_in: Joi.number().required(),
    live_mode: Joi.boolean().required(),
    public_key: Joi.string().required(),
    refresh_token: Joi.string().required(),
    scope: Joi.string().required(),
    token_type: Joi.string().required(),
    user_id: Joi.number().required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(
    [
      'access_token',
      'expires_in',
      'live_mode',
      'public_key',
      'refresh_token',
      'scope',
      'token_type',
      'user_id',
    ],
    (mySchema) => mySchema.optional(),
  );
};

export const createStoreSchema = (optional = false) => {
  const schema = Joi.object().keys({
    id: Joi.string().required(),
    version: Joi.number().required(),
    name: Joi.string().required(),
    phone: Joi.string().required(),
    images: Joi.array().items(Joi.string()),
    delivery_time: createIntegerRangeSchema(optional).required(),
    delivery_area: createDeliveryAreaSchema(optional).required(),
    opening_hours: createOpeningHoursSchema(optional).required(),
    seller_credentials: createSellerCredentialsSchema(optional).required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(
    [
      'id',
      'version',
      'name',
      'phone',
      'images',
      'delivery_time',
      'delivery_area',
      'opening_hours',
      'seller_credentials',
    ],
    (mySchema) => mySchema.optional(),
  );
};

export const createProductSchema = (optional = false) => {
  const schema = Joi.object({
    type: Joi.string().allow('product', 'service').required(),
    name: Joi.string().required(),
    description: Joi.string().required(),
    images: Joi.array().items(Joi.string()).required(),
    price: Joi.number().optional().allow(null), // for product is required
    brand: Joi.string().optional().allow(''),
    category: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).optional(),
    store: createStoreSchema(optional).required(),
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
      'category',
      'tags',
      'store',
    ],
    (mySchema) => mySchema.optional(),
  );
};

export const createCreateParamsSchema = (body: any) =>
  Joi.object({
    body,
    source: Joi.array().items(Joi.string()).optional(),
  });
