export enum ErrorCode {
  Unauthorized = "UNAUTHORIZED",
  Forbidden = "FORBIDDEN",
  NotFound = "NOT_FOUND",
  ValidationError = "VALIDATION_ERROR",
  Conflict = "CONFLICT",
  StaleResource = "STALE_RESOURCE",
  RateLimited = "RATE_LIMITED",
  AccountInactive = "ACCOUNT_INACTIVE",
  TenantContext = "TENANT_CONTEXT",
  NetworkError = "NETWORK_ERROR",
  InternalError = "INTERNAL_ERROR",
}

export interface FieldError {
  field: string;
  message: string;
  type?: string;
}

export interface ErrorDetails {
  fields?: FieldError[];
  retry_after?: number;
  [key: string]: unknown;
}

export interface ErrorEnvelope {
  code: string;
  message: string;
  details: ErrorDetails;
  request_id?: string;
}

export class ApiError extends Error {
  readonly code: string;
  readonly details: ErrorDetails;
  readonly requestId?: string;
  readonly status: number;

  constructor(status: number, envelope: ErrorEnvelope) {
    super(envelope.message);
    this.name = "ApiError";
    this.code = envelope.code;
    this.details = envelope.details;
    this.requestId = envelope.request_id;
    this.status = status;
  }

  is(code: string | ErrorCode): boolean {
    return this.code === code;
  }

  /** Field errors from a 422 VALIDATION_ERROR response */
  get fieldErrors(): FieldError[] {
    return this.details.fields ?? [];
  }

  /** Retry delay in seconds from a RATE_LIMITED response */
  get retryAfter(): number | undefined {
    const value = this.details.retry_after;
    return typeof value === "number" ? value : undefined;
  }
}

export interface CursorParams {
  limit?: number;
  cursor?: string;
}

export interface CursorPage<T> {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
}

export type ID = string;

/** ISO-8601 UTC datetime string */
export type ISODateTime = string;
/** YYYY-MM-DD date string */
export type ISODate = string;
