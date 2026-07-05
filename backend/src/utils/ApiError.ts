export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public data?: Record<string, any>,
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
