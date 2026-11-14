export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors: any[];

  constructor(statusCode: number, message: string, errors: any[] = [], isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors: any[] = []): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message: string = 'Authentication required'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message: string = 'You do not have permission to perform this action'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message: string = 'Requested resource not found'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string, errors: any[] = []): ApiError {
    return new ApiError(409, message, errors);
  }

  static unprocessable(message: string, errors: any[] = []): ApiError {
    return new ApiError(422, message, errors);
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(500, message, [], false);
  }
}
