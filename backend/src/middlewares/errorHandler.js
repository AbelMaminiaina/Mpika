/**
 * Error Handling Middleware
 */

const logger = require('../utils/logger');
const { ApiResponse } = require('../utils/apiResponse');

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(message, statusCode = 400, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', data = null) {
    return new ApiError(message, 400, data);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(message, 403);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(message, 404);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(message, 409);
  }

  static validation(errors) {
    return new ApiError('Validation failed', 422, errors);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(message, 500);
  }
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res, next) {
  const error = ApiError.notFound(`Route ${req.originalUrl} not found`);
  next(error);
}

/**
 * Global error handler
 */
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let data = err.data || null;

  // Handle Prisma errors
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        message = 'A record with this value already exists';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint failed';
        break;
      default:
        if (err.code.startsWith('P')) {
          statusCode = 400;
          message = 'Database operation failed';
        }
    }
  }

  // Handle validation errors from express-validator
  if (err.array && typeof err.array === 'function') {
    statusCode = 422;
    message = 'Validation failed';
    data = err.array();
  }

  // Log error
  if (statusCode >= 500) {
    logger.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      userId: req.userId,
    });
  } else if (process.env.NODE_ENV === 'development') {
    logger.warn('Client Error:', {
      message: err.message,
      statusCode,
      url: req.originalUrl,
    });
  }

  // Don't expose internal errors in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal server error';
    data = null;
  }

  res.status(statusCode).json(ApiResponse.error(message, data));
}

/**
 * Async handler wrapper to catch errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  ApiError,
  notFoundHandler,
  errorHandler,
  asyncHandler,
};
