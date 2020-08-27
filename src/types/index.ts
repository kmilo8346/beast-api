import {
  ExpoPushTicket,
  ExpoPushReceipt,
  ExpoPushMessage,
} from 'expo-server-sdk';

export interface CreateParams<T> {
  body: T;
  source?: string[];
  idempotency?: string;
}

export interface UpdateParams<T> {
  idempotency?: string;
  body: Partial<T>;
}

export interface ActionParams<T> {
  idempotency?: string;
  body: Partial<T>;
}

export interface GetParams {
  source?: string[];
}

export interface GetAllParams {
  from: number;
  size: number;
  source?: string[];
}

export type SortParam = { field: string; order: 'asc' | 'desc' }[];

export interface SearchParams {
  query?: string;
  filters?: { [key: string]: any };
  from: number;
  size: number;
  sort?: SortParam;
  source?: string[];
}

export interface SearchResponse<T> {
  query?: string;
  filters?: { [key: string]: any };
  from: number;
  size: number;
  sort?: SortParam;
  total: number;
  hits: T[];
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

export interface SellerCredentials {
  access_token: string;
  expires_in: number;
  live_mode: boolean;
  public_key: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  user_id: number;
}

export interface DeliveryArea {
  center: Place;
  radius: string;
  geometry: Circle;
}

export type OpeningHours = {
  day: '1' | '2' | '3' | '4' | '5' | '6' | '7';
  open: number;
  close: number;
}[];

export interface AddressProp {
  short_name: string;
  long_name: string;
}

export interface Location {
  lat: number;
  lng: number;
}

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
    location: Location;
  };
}

export interface CreateAnonymouslyUser {
  id: string;
  current_address: string;
  addresses: Place[];
}

export interface CreateLoggedUser {
  id: string;
  email: string;
  first_name: string;
  last_name?: string;
  photo_url: string;
  phone: string;
  phone_verified: boolean;
  current_address: string;
  addresses: Place[];
}

export type CreateUser = CreateAnonymouslyUser | CreateLoggedUser;

export interface AnonymouslyUser extends CreateAnonymouslyUser {
  created_at: Date;
  updated_at: Date;
}

export interface LoggedUser extends CreateLoggedUser {
  current_store?: string;
  created_at: Date;
  updated_at: Date;
}

export type User = AnonymouslyUser | LoggedUser;

export enum PaymentProvider {
  MERCADOPAGO = 'mercadopago',
}

export enum DispatchProvider {
  OWNER = 'owner',
}

export interface CreateStore {
  user: string;
  name: string;
  phone: string;
  images: string[];
  delivery_time: IntegerRange;
  delivery_area: DeliveryArea;
  opening_hours: OpeningHours;
  seller_credentials: SellerCredentials;
  payment_provider: PaymentProvider;
  dispatch_provider: DispatchProvider;
}

export interface Store extends CreateStore {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProduct {
  name: string;
  description: string;
  images: string[];
  price: number;
  tags: string[];
  enabled: boolean;
}

export interface Product extends CreateProduct {
  id: string;
  store: string;
  created_at: Date;
  updated_at: Date;
}

export interface Customer {
  id: string;
  email: string;
  first_name: string;
  last_name?: string;
  photo_url?: string;
  phone: string;
}

export interface Item extends Omit<Product, 'store'> {
  qty: number;
}

export interface Transaction {
  country: string;
  currency: string;
  language: string;
  delivery_address: Place;
  shopping_cart: Item[];
  store: Store;
}

export interface CreatePayment {
  customer: Customer;
  transaction: Transaction;
  redirect_url: string;
}

export interface CreateCheckout {
  reference: string;
  customer: Customer;
  transaction: Transaction;
  redirect_url: string;
}

export enum MercadopagoPaymentStatus {
  STARTED = 'started',
  PENDING = 'pending',
  APPROVED = 'approved',
  AUTHORIZED = 'authorized',
  IN_PROCESS = 'in_process',
  IN_MEDIATION = 'in_mediation',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  CHARGED_BACK = 'charged_back',
}

export type PaymentProviderState = {
  id: PaymentProvider.MERCADOPAGO;
  status: MercadopagoPaymentStatus;
  checkout: { id: string; init_point: string };
  data: { [key: string]: any };
};

export enum PaymentStatus {
  CREATED = 'created',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export interface Payment extends CreatePayment {
  id: string;
  reference: string;
  status: PaymentStatus;
  provider: PaymentProviderState;
  idempotency?: string;
  created_at: Date;
  updated_at: Date;
}

export enum OrderStatus {
  CREATED = 'created',
  CONFIRMED = 'confirmed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum ProductConfirmationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  REPLACE = 'replace',
}

export type ProductConfirmation =
  | { type: ProductConfirmationType.UPDATE; id: string; qty_posible: number }
  | { type: ProductConfirmationType.DELETE; id: string };

export type Confirmation = ProductConfirmation[];

export enum OwnerDispatchStatus {
  CREATED = 'created',
  CONFIRMED = 'confirmed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface DispatchProviderState {
  id: DispatchProvider.OWNER;
  status: OwnerDispatchStatus;
  confirmation?: Confirmation;
}

export interface CreateOrder {
  reference: string;
  customer: Customer;
  transaction: Transaction;
  idempotency?: string;
}

export interface Order extends CreateOrder {
  id: string;
  status: OrderStatus;
  provider: DispatchProviderState;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDevice {
  token: string;
  user_id: string;
}

export interface Device extends CreateDevice {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationFilters {
  user: string;
}

export interface NotificationMessage extends Omit<ExpoPushMessage, 'to'> {}

export interface CreateNotification {
  filters: NotificationFilters;
  message: NotificationMessage;
}

export interface Notification extends CreateNotification {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export enum MessageReceiptStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export interface CreateMessageReceipt {
  notification: string;
  expo_ticket: ExpoPushTicket;
}

export interface MessageReceipt extends CreateMessageReceipt {
  id: string;
  status: MessageReceiptStatus;
  expo_receipt?: ExpoPushReceipt;
  created_at: Date;
  updated_at: Date;
}

export enum WidgetType {
  BANNER = 'banner',
  NEARBY_STORES = 'nearby_stores',
}

export interface BannerInstructions {
  image: string;
}

export interface NearbyStoresInstructions {
  title: string;
  from: number;
  size: number;
}

export interface CreateWidget {
  type: WidgetType;
  tags: string[];
  sort: number;
  instructions: BannerInstructions | NearbyStoresInstructions;
}

export interface Widget extends CreateWidget {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export interface BannerContent {
  image: string;
}

export interface NearbyStoresContent {
  title: string;
  initial: SearchResponse<Store>;
}

export interface ComputedWidget {
  id: string;
  type: WidgetType;
  content: BannerContent | NearbyStoresContent;
}

export interface ComputeContext {
  location: Location;
}

export interface ComputeFilters {
  tag: string;
}

export interface ComputeParams {
  filters: ComputeFilters;
  context: ComputeContext;
  from: number;
  size: number;
}

export interface ComputeResponse {
  filters: ComputeFilters;
  from: number;
  size: number;
  total: number;
  hits: ComputedWidget[];
}
