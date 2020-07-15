export interface CreateParams<T> {
  body: T;
  source?: string[];
}

export interface UpdateParams<T> {
  id: string;
  body: Partial<T>;
  source?: string[];
}

export interface GetParams {
  id: string;
  source?: string[];
}

export interface GetAllParams {
  from: number;
  size: number;
  source?: string[];
}

export interface SearchParams {
  query?: string;
  filters?: { [key: string]: any };
  from: number;
  size: number;
  source?: string[];
}

export interface SearchResponse {
  total: number;
  hits: any[];
}

export interface CreateResponse {
  id: string;
  result: any;
  statusCode: number | null;
}

export interface UpdateResponse {
  id: string;
  result: any;
  statusCode: number | null;
}

export interface Product {
  id: string;
  type: 'product' | 'service';
  name: string;
  description?: string;
  images: string[];
  price: number | null;
  brand?: string;
  format?: string;
  tags: string[];
  categories: string[];
  store: Store;
  qty: number;
}

export interface Store {
  id: string;
  version: number;
  name: string | undefined;
  phone: string | undefined;
  images: string[] | undefined;
  deliveryTime: IntegerRange | undefined;
  deliveryArea: Circle | undefined;
  openingHours: OpeningHours | undefined;
  sellerCredentials: SellerCredentials | undefined;
}

export interface SellerCredentials {
  accessToken: string;
  expiresIn: number;
  liveMode: boolean;
  publicKey: string;
  refreshToken: string;
  scope: string;
  tokenType: string;
  userId: number;
}

export interface IntegerRange {
  lte: number;
  gte: number;
}

export interface Circle {
  center: Place;
  radius: string;
}

export type OpeningHours = {
  day: '1' | '2' | '3' | '4' | '5' | '6' | '7';
  open: number;
  close: number;
}[];

export interface Place {
  id: string;
  url: string;
  streetNumber: AddressProp;
  route: AddressProp;
  locality: AddressProp;
  administrativeAreaLevel3: AddressProp;
  administrativeAreaLevel2: AddressProp;
  administrativeAreaLevel1: AddressProp;
  apartment: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    viewport: {
      northeast: {
        lat: number;
        lng: number;
      };
      southwest: {
        lat: number;
        lng: number;
      };
    };
  };
}

export interface AddressProp {
  shortName: string;
  longName: string;
}
