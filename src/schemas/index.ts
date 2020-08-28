import Joi, { ObjectSchema, AlternativesSchema } from '@hapi/joi';

export const LocationFactory = () =>
  Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  });

const PlaceGeometryLocationFactory = (optional = false) => {
  const schema = Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(['lat', 'lng'], (mySchema) => mySchema.optional());
};

const PlaceGeometryFactory = (optional = false) => {
  const schema = Joi.object({
    location: PlaceGeometryLocationFactory(optional).required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(['location'], (mySchema) => mySchema.optional());
};

const AddressPropFactory = (optional = false) => {
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

export const PlaceFactory = (optional = false) => {
  const schema = Joi.object({
    id: Joi.string().required(),
    url: Joi.string().uri().required(),
    street_number: AddressPropFactory(optional).required(),
    route: AddressPropFactory(optional).required(),
    locality: AddressPropFactory(optional).required(),
    administrative_area_level_3: AddressPropFactory(optional).required(),
    administrative_area_level_2: AddressPropFactory(optional).required(),
    administrative_area_level_1: AddressPropFactory(optional).required(),
    apartment: Joi.string().allow(''),
    geometry: PlaceGeometryFactory(optional).required(),
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
      'administrative_area_level_3',
      'administrative_area_level_2',
      'administrative_area_level_1',
      'apartment',
      'geometry',
    ],
    (mySchema) => mySchema.optional(),
  );
};

const CircleFactory = (optional = false) => {
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

const IntegerRangeFactory = (optional = false) => {
  const schema = Joi.object({
    lte: Joi.number(),
    gte: Joi.number(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(['lte', 'gte'], (mySchema) => mySchema.optional());
};

const DeliveryAreaFactory = (optional = false) => {
  const schema = Joi.object().keys({
    center: PlaceFactory(optional).required(),
    radius: Joi.string().required(),
    geometry: CircleFactory(optional).required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(['center', 'radius', 'geometry'], (mySchema) =>
    mySchema.optional(),
  );
};

const OpeningHoursFactory = (optional = false) => {
  const schema = Joi.array().items(
    Joi.object({
      day: Joi.string().required(), // TODO: 1 - 7
      open: Joi.number().min(0).max(2359).required(),
      close: Joi.number().min(0).max(2359).required(),
    }),
  );
  return schema;
};

const SellerCredentialsFactory = (optional = false) => {
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

export const CreateStoreFactory = (optional = false) => {
  const schema = Joi.object().keys({
    user: Joi.string().required(),
    name: Joi.string().required(),
    phone: Joi.string().required(),
    reference: Joi.string().required(),
    images: Joi.array().items(Joi.string()),
    delivery_time: IntegerRangeFactory(optional).required(),
    delivery_area: DeliveryAreaFactory(optional).required(),
    opening_hours: OpeningHoursFactory(optional).required(),
    seller_credentials: SellerCredentialsFactory(optional).required(),
    payment_provider: Joi.string().allow('mercadopago').required(),
    dispatch_provider: Joi.string().allow('owner').required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(
    [
      'user',
      'name',
      'phone',
      'images',
      'delivery_time',
      'delivery_area',
      'opening_hours',
      'seller_credentials',
      'payment_provider',
      'dispatch_provider',
    ],
    (mySchema) => mySchema.optional(),
  );
};

export const StoreFactory = (optional = false) => {
  const schema = CreateStoreFactory(optional).keys({
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

export const CreateProductFactory = (optional = false) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    price: Joi.number().required(),
    enabled: Joi.boolean().required(),
    reference: Joi.string().required(),
    description: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).required(),
    images: Joi.array().items(Joi.string()).required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(
    ['name', 'description', 'images', 'price', 'tags', 'enabled', 'reference'],
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

export const GetParamsFactory = () =>
  Joi.object({
    source: Joi.array().items(Joi.string()).optional(),
  });

export const SearchParamsFactory = (filters: ObjectSchema) =>
  Joi.object({
    query: Joi.string().allow('').optional(),
    filters: filters.optional(),
    from: Joi.number().integer().min(0).default(0),
    size: Joi.number().min(0).max(100).default(10),
    sort: Joi.array()
      .items(
        Joi.object({
          field: Joi.string().required(),
          order: Joi.string().allow('desc', 'asc').required(),
        }),
      )
      .optional(),
    source: Joi.array().items(Joi.string()).optional(),
  });

export const CreateParamsFactory = (body: ObjectSchema | AlternativesSchema) =>
  Joi.object({
    body: body.required(),
    source: Joi.array().items(Joi.string()).optional(),
    idempotency: Joi.string().optional(),
  });

export const UpdateParamsFactory = (body: ObjectSchema | AlternativesSchema) =>
  Joi.object({
    idempotency: Joi.string().optional(),
    body: body.required(),
  });

export const ActionParamsFactory = (body?: ObjectSchema) => {
  const object: { [key: string]: any } = {
    idempotency: Joi.string().optional(),
  };
  if (body) {
    object.body = body.required();
  }
  return Joi.object(object);
};
