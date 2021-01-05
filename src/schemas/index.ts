import Joi, { ObjectSchema, AlternativesSchema } from '@hapi/joi';

export const LocationFactory = () =>
  Joi.object({
    lat: Joi.number().required(),
    lon: Joi.number().required(),
  });

const PlaceGeometryLocationFactory = (optional = false) => {
  const schema = Joi.object({
    lat: Joi.number().required(),
    lon: Joi.number().required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(['lat', 'lon'], (mySchema) => mySchema.optional());
};

export const AddressPropFactory = (optional = false) => {
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
    street_number: AddressPropFactory(optional).optional(),
    route: AddressPropFactory(optional).optional(),
    locality: AddressPropFactory(optional).required(),
    administrative_area_level_3: AddressPropFactory(optional).required(),
    administrative_area_level_2: AddressPropFactory(optional).required(),
    administrative_area_level_1: AddressPropFactory(optional).required(),
    apartment: Joi.string().allow('').optional(),
    location: PlaceGeometryLocationFactory(optional).required(),
    formatted_address: Joi.string().optional(),
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
      'location',
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

export const IntegerRangeFactory = (optional = false) => {
  const schema = Joi.object({
    lte: Joi.number(),
    gte: Joi.number(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(['lte', 'gte'], (mySchema) => mySchema.optional());
};

export const DeliveryAreaFactory = (optional = false) => {
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

export const OpeningHoursFactory = (optional = false) => {
  const schema = Joi.array().items(
    Joi.object({
      day: Joi.string().required(), // TODO: 1 - 7
      open: Joi.number().min(0).max(2359).required(),
      close: Joi.number().min(0).max(2359).required(),
      hours: Joi.array()
        .items(
          Joi.object({
            open: Joi.number().min(0).max(2359).required(),
            close: Joi.number().min(0).max(2359).required(),
          }),
        )
        .optional(),
    }),
  );
  return schema;
};

const MercadoPagoCredentialsFactory = (optional = false) => {
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

export const PaymentProviderFactory = (optional = false) => {
  const schema = Joi.object({
    credentials: MercadoPagoCredentialsFactory(optional).required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(['credentials'], (mySchema) => mySchema.optional());
};

export const CreateStoreFactory = (optional = false) => {
  const schema = Joi.object().keys({
    user: Joi.string().required(),
    name: Joi.string().required(),
    phone: Joi.string().required(),
    enabled: Joi.boolean().required(),
    reference: Joi.string().required(),
    description: Joi.string().allow('').optional(),
    images: Joi.array().items(Joi.string()),
    delivery_time: IntegerRangeFactory(optional).required(),
    delivery_area: DeliveryAreaFactory(optional).required(),
    opening_hours: OpeningHoursFactory(optional).required(),
    payment_provider: PaymentProviderFactory(optional).allow(null).optional(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(
    [
      'user',
      'name',
      'phone',
      'enabled',
      'reference',
      'description',
      'images',
      'delivery_time',
      'delivery_area',
      'opening_hours',
      'payment_provider',
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

export const StoreInfoFactory = (optional = false) => {
  const schema = Joi.object({
    id: Joi.string().required(),
    enabled: Joi.boolean().required(),
    delivery_area: CircleFactory(optional).required(),
    opening_hours: OpeningHoursFactory(optional).required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(
    ['id', 'enabled', 'delivery_area', 'opening_hours'],
    (mySchema) => mySchema.optional(),
  );
};

export const CreateProductFactory = (optional = false) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    price: Joi.number().required(),
    enabled: Joi.boolean().required(),
    reference: Joi.string().required(),
    description: Joi.string().allow('').optional(),
    tags: Joi.array().items(Joi.string()).required(),
    images: Joi.array().items(Joi.string()).required(),
  });
  if (!optional) {
    return schema;
  }
  return schema.fork(
    ['name', 'price', 'enabled', 'reference', 'description', 'tags', 'images'],
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
  return schema.fork(['id', 'created_at', 'updated_at'], (mySchema) =>
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
    sort: Joi.object().optional(),
    source: Joi.array().items(Joi.string()).optional(),
  });

export const CreateParamsFactory = (body: ObjectSchema | AlternativesSchema) =>
  Joi.object({
    body: body.required(),
    source: Joi.array().items(Joi.string()).optional(),
  });

export const UpdateParamsFactory = (body: ObjectSchema | AlternativesSchema) =>
  Joi.object({
    body: body.required(),
    source: Joi.array().items(Joi.string()).optional(),
  });

export const ActionParamsFactory = (body?: ObjectSchema) => {
  const object: { [key: string]: any } = {
    source: Joi.array().items(Joi.string()).optional(),
  };
  if (body) {
    object.body = body.required();
  }
  return Joi.object(object);
};
