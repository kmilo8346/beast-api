export interface CreateParams<T> {
  body: T;
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
  gte: number;
  lte: number;
}

export interface Circle {
  type: 'circle';
  radius: string;
  coordinates: number[];
}

export type OpeningHours = {
  day: '1' | '2' | '3' | '4' | '5' | '6' | '7';
  open: number;
  close: number;
}[];

export interface Place {
  id: string;
  url: string;
  street_number: AddressProp;
  route: AddressProp;
  locality: AddressProp;
  administrative_area_level_3: AddressProp;
  administrative_area_level_2: AddressProp;
  administrative_area_level_1: AddressProp;
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
  short_name: string;
  long_name: string;
}

export interface Store {
  id: string;
  version: number;
  name: string | undefined;
  phone: string | undefined;
  images: string[] | undefined;
  delivery_time: IntegerRange | undefined;
  delivery_area: Circle | undefined;
  opening_hours: OpeningHours | undefined;
  seller_credentials: SellerCredentials | undefined;
}

export interface Product {
  id: string;
  type: 'product';
  name: string;
  description: string;
  images: string[];
  price: number;
  brand?: string;
  category: string;
  tags?: string[];
  store: Store;
}

export interface Service {
  id: string;
  type: 'service';
  name: string;
  description: string;
  images: string[];
  price: number | null;
  category: string;
  tags?: string[];
  store: Store;
}
