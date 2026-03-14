import type { Request, Response, NextFunction } from "express";

interface AppError extends Error {
  status?: number;
  code?: string;
}

/**
 * Central error handler — must be the last middleware registered.
 * Catches all errors thrown by route handlers.
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = err.status ?? 500;
  const code = err.code ?? "INTERNAL_ERROR";

  console.error(
    `[ERROR] ${req.method} ${req.path} → ${status} ${code}:`,
    err.message,
  );

  // Don't leak stack traces in production
  const isDev = process.env.NODE_ENV !== "production";

  res.status(status).json({
    error: {
      code,
      message: status === 500 ? "An unexpected error occurred." : err.message,
      timestamp: new Date().toISOString(),
      ...(isDev && status === 500 ? { stack: err.stack } : {}),
    },
  });
}

/** Helper — throw typed HTTP errors from route handlers */
export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "HttpError";
  }
}
