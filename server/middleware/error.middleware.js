/**
 * Error Handling Middleware
 */

import { validationResult } from "express-validator";

/**
 * Custom Error Classes
 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, 403);
    this.name = "AuthorizationError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(message, 409);
    this.name = "ConflictError";
  }
}

/**
 * Validation middleware
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validasi input gagal",
        details: errors.array().map((err) => ({
          field: err.path || err.param,
          message: err.msg,
          value: err.value,
        })),
      },
    });
  }

  next();
};

/**
 * Not Found Handler
 */
export const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} tidak ditemukan`);
  next(error);
};

/**
 * Global Error Handler
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errorCode = err.name || "INTERNAL_ERROR";

  // Handle specific error types
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Token tidak valid";
    errorCode = "INVALID_TOKEN";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token sudah kadaluarsa";
    errorCode = "TOKEN_EXPIRED";
  }

  if (err.code === "23505") {
    // PostgreSQL unique violation
    statusCode = 409;
    message = "Data sudah ada";
    errorCode = "DUPLICATE_ENTRY";
  }

  if (err.code === "23503") {
    // PostgreSQL foreign key violation
    statusCode = 400;
    message = "Data referensi tidak valid";
    errorCode = "INVALID_REFERENCE";
  }

  if (err.code === "22P02") {
    // PostgreSQL invalid text representation
    statusCode = 400;
    message = "Format data tidak valid";
    errorCode = "INVALID_FORMAT";
  }

  // Log error in development
  if (process.env.NODE_ENV === "development") {
    console.error("Error:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
    });
  }

  // Send response
  const response = {
    success: false,
    error: {
      code: errorCode,
      message: message,
    },
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === "development" && !err.isOperational) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Async handler wrapper
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
