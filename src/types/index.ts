export interface CreateParams<T> {
  body: T;
  source?: string[];
}

export interface UpdateParams<T> {
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
