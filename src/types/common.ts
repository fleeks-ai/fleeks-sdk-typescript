/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

/** Generic API response */
export interface ApiResponse<T = Record<string, unknown>> {
  data: T;
  message?: string;
  status?: string;
}
