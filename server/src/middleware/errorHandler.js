import { sendError } from '../utils/apiResponse.js';

export const errorHandler = (err, req, res, next) => {
  console.error('[Unhandled Error]', err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((el) => el.message);
    return sendError(res, 'Validation Failed', statusCode, errors);
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered for '${field}'. Please use another value.`;
    return sendError(res, message, statusCode);
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format for field '${err.path}'`;
    return sendError(res, message, statusCode);
  }

  return sendError(
    res,
    process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : message,
    statusCode
  );
};
