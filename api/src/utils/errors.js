/** Error carrying an HTTP status code, so route handlers can just `throw`. */
export class HttpError extends Error {
  constructor(status, message, options = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = options.code ?? null;
    this.details = options.details ?? null;
  }
}

export const badRequest = (message = 'Invalid request', options) =>
  new HttpError(400, message, options);
export const unauthorized = (message = 'Please sign in to continue', options) =>
  new HttpError(401, message, options);
export const forbidden = (message = 'You do not have access to this resource', options) =>
  new HttpError(403, message, options);
export const notFound = (message = 'Not found', options) => new HttpError(404, message, options);
export const conflict = (message = 'That conflicts with existing data', options) =>
  new HttpError(409, message, options);
export const tooMany = (message = 'Too many requests', options) => new HttpError(429, message, options);
export const serverError = (message = 'Something went wrong', options) =>
  new HttpError(500, message, options);

/** Wraps an async route so rejected promises reach the error middleware. */
export const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
