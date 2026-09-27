import { ZodError } from 'zod';
import config from '../config/env.js';
import { HttpError } from '../utils/errors.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: { message: `No API route matches ${req.method} ${req.originalUrl}`, code: 'NOT_FOUND' },
  });
}

export function errorHandler(error, req, res, _next) {
  let status = 500;
  let message = 'Something went wrong on our side. Please try again.';
  let code = 'INTERNAL_ERROR';
  let details = null;

  if (error instanceof HttpError) {
    status = error.status;
    message = error.message;
    code = error.code ?? 'REQUEST_ERROR';
    details = error.details;
  } else if (error instanceof ZodError) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = error.issues[0]?.message ?? 'Invalid request';
    details = error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
  } else if (error?.code === '23505') {
    status = 409;
    code = 'DUPLICATE';
    message = 'That record already exists';
  } else if (error?.code === '23503') {
    status = 400;
    code = 'FOREIGN_KEY';
    message = 'Referenced record does not exist';
  } else if (error?.code === '22P02' || error?.code === '23514') {
    status = 400;
    code = 'BAD_INPUT';
    message = 'One of the supplied values is not valid';
  } else if (error?.type === 'entity.too.large') {
    status = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'That file is too large';
  } else if (error?.type === 'entity.parse.failed') {
    status = 400;
    code = 'BAD_JSON';
    message = 'Request body is not valid JSON';
  }

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, error);
  } else if (!config.isProd) {
    console.warn(`[warn] ${req.method} ${req.originalUrl} -> ${status} ${message}`);
  }

  res.status(status).json({
    error: {
      message,
      code,
      ...(details ? { details } : {}),
      ...(config.isProd ? {} : { stack: error?.stack }),
    },
  });
}
