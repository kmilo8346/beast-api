export interface SearchParams {
  query?: string;
  filters?: {
    position?: number[];
  };
  from: number;
  size: number;
  source?: string[];
}

export interface SearchResponse {
  total: number;
  hits: any[];
}
