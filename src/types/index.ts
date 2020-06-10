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
