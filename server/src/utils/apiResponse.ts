export class ApiResponse<T = any> {
  public success: boolean;
  public message: string;
  public data?: T;
  public timestamp: string;

  constructor(success: boolean, message: string, data?: T) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(message: string, data?: T): ApiResponse<T> {
    return new ApiResponse(true, message, data);
  }

  static error(message: string, data?: any): ApiResponse {
    return new ApiResponse(false, message, data);
  }
}
