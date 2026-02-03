/**
 * Standardized API Response Helpers
 */

class ApiResponse {
  constructor(success, data = null, message = null, meta = null) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.meta = meta;
    this.timestamp = new Date().toISOString();
  }

  static success(data = null, message = 'Success', meta = null) {
    return new ApiResponse(true, data, message, meta);
  }

  static error(message = 'An error occurred', data = null) {
    return new ApiResponse(false, data, message, null);
  }

  static paginated(data, page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    return new ApiResponse(true, data, 'Success', {
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  }
}

// Response helper functions
function sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json(ApiResponse.success(data, message));
}

function sendCreated(res, data = null, message = 'Created successfully') {
  return res.status(201).json(ApiResponse.success(data, message));
}

function sendError(res, message = 'An error occurred', statusCode = 400, data = null) {
  return res.status(statusCode).json(ApiResponse.error(message, data));
}

function sendNotFound(res, message = 'Resource not found') {
  return res.status(404).json(ApiResponse.error(message));
}

function sendUnauthorized(res, message = 'Unauthorized') {
  return res.status(401).json(ApiResponse.error(message));
}

function sendForbidden(res, message = 'Forbidden') {
  return res.status(403).json(ApiResponse.error(message));
}

function sendValidationError(res, errors) {
  return res.status(422).json(ApiResponse.error('Validation failed', errors));
}

function sendPaginated(res, data, page, limit, total) {
  return res.status(200).json(ApiResponse.paginated(data, page, limit, total));
}

module.exports = {
  ApiResponse,
  sendSuccess,
  sendCreated,
  sendError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendValidationError,
  sendPaginated,
};
