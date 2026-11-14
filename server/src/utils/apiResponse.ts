export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export class ApiResponse<T = any> {
  public readonly success: boolean;
  public readonly message: string;
  public readonly data?: T;
  public readonly meta?: PaginationMeta;
  public readonly timestamp: string;

  constructor(success: boolean, message: string, data?: T, meta?: PaginationMeta) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.meta = meta;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(message: string, data?: T): ApiResponse<T> {
    return new ApiResponse(true, message, data);
  }

  static paginated<T>(message: string, data: T, meta: PaginationMeta): ApiResponse<T> {
    return new ApiResponse(true, message, data, meta);
  }

  static error(message: string, data?: any): ApiResponse {
    return new ApiResponse(false, message, data);
  }
}
