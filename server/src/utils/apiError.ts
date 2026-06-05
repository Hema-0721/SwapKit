export class ApiError extends Error {
  public statusCode: number;
  public errorCode: string;
  public errors?: any[];

  constructor(statusCode: number, message: string, errorCode: string, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', errorCode: string = 'NOT_FOUND') {
    super(404, message, errorCode);
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string, errorCode: string = 'BAD_REQUEST', errors?: any[]) {
    super(400, message, errorCode, errors);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', errorCode: string = 'UNAUTHORIZED') {
    super(401, message, errorCode);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', errorCode: string = 'FORBIDDEN') {
    super(403, message, errorCode);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, errorCode: string = 'CONFLICT') {
    super(409, message, errorCode);
  }
}
