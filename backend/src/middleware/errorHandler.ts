import type { NextFunction, Request, Response } from "express";

interface AppError extends Error {
  status?: number;
  code?: string;
}

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

  // hide stacks in prod
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
