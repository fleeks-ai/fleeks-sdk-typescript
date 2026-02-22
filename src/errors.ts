/**
 * Fleeks SDK Error Hierarchy
 *
 * FleeksError
 * ├── FleeksAPIError (statusCode, response)
 * │   ├── FleeksRateLimitError (retryAfter) → 429
 * │   ├── FleeksAuthenticationError → 401
 * │   ├── FleeksPermissionError → 403
 * │   ├── FleeksResourceNotFoundError → 404
 * │   └── FleeksValidationError → 422
 * ├── FleeksConnectionError
 * ├── FleeksStreamingError
 * └── FleeksTimeoutError
 */

export class FleeksError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FleeksError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class FleeksAPIError extends FleeksError {
  readonly statusCode?: number;
  readonly response?: unknown;

  constructor(message: string, statusCode?: number, response?: unknown) {
    super(message);
    this.name = 'FleeksAPIError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

export class FleeksRateLimitError extends FleeksAPIError {
  readonly retryAfter: number; // seconds

  constructor(message: string, retryAfter: number = 60, response?: unknown) {
    super(message, 429, response);
    this.name = 'FleeksRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class FleeksAuthenticationError extends FleeksAPIError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'FleeksAuthenticationError';
  }
}

export class FleeksPermissionError extends FleeksAPIError {
  constructor(message: string) {
    super(message, 403);
    this.name = 'FleeksPermissionError';
  }
}

export class FleeksResourceNotFoundError extends FleeksAPIError {
  constructor(message: string) {
    super(message, 404);
    this.name = 'FleeksResourceNotFoundError';
  }
}

export class FleeksValidationError extends FleeksAPIError {
  constructor(message: string) {
    super(message, 422);
    this.name = 'FleeksValidationError';
  }
}

export class FleeksConnectionError extends FleeksError {
  constructor(message: string) {
    super(message);
    this.name = 'FleeksConnectionError';
  }
}

export class FleeksStreamingError extends FleeksError {
  constructor(message: string) {
    super(message);
    this.name = 'FleeksStreamingError';
  }
}

export class FleeksTimeoutError extends FleeksError {
  constructor(message: string) {
    super(message);
    this.name = 'FleeksTimeoutError';
  }
}
