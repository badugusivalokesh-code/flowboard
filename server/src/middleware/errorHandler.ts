import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

interface ErrorResponseBody {
  error: {
    message: string;
    statusCode: number;
    details?: unknown;
    stack?: string;
  };
}

/**
 * Centralized error handler. Every thrown ApiError (and unexpected
 * errors) end up here so the API always returns a consistent JSON shape,
 * and stack traces never leak in production.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const isProd = process.env.NODE_ENV === 'production';

  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err && typeof err === 'object' && 'name' in err) {
    const e = err as { name: string; message?: string; code?: number; keyValue?: Record<string, unknown> };
    if (e.name === 'ValidationError') {
      statusCode = 400;
      message = e.message || 'Validation failed';
    } else if (e.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid identifier';
    } else if (e.code === 11000) {
      statusCode = 409;
      const field = e.keyValue ? Object.keys(e.keyValue)[0] : 'field';
      message = `${field} already in use`;
    }
  }

  if (!isProd && statusCode === 500) {
    console.error(err);
  }

  const body: ErrorResponseBody = {
    error: { message, statusCode, details },
  };

  if (!isProd && err instanceof Error) {
    body.error.stack = err.stack;
  }

  res.status(statusCode).json(body);
}
