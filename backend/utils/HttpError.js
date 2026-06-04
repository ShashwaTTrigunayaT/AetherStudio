/**
 * Custom error class that includes an HTTP status code.
 * Throw this in route handlers to return proper HTTP error responses.
 */
export class HttpError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} status - HTTP status code (default 500)
   */
  constructor(message, status = 500) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}
