import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest, UserRole } from "../types/index.js";

/**
 * check user role
 */
export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const authedReq = req as AuthenticatedRequest;
    const userRole = authedReq.role;

    if (!roles.includes(userRole)) {
      res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: `Access denied. Required role: ${roles.join(" or ")}. Your role: ${userRole}.`,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  };
