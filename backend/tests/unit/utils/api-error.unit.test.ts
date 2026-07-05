import { ApiError } from '../../../src/utils/ApiError';

describe('ApiError', () => {
  it('should instantiate correctly with required arguments', () => {
    const error = new ApiError(400, 'Bad Request');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Bad Request');
    expect(error.name).toBe('ApiError');
    expect(error.data).toBeUndefined();
  });

  it('should store optional data payload', () => {
    const data = { retryAfter: 60 };
    const error = new ApiError(429, 'Too many requests', data);
    expect(error.data).toEqual(data);
  });
});
