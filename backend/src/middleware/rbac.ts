import type { Request, Response, NextFunction } from "express";
import type { UserRole, AuthenticatedRequest } from "../types/index.js";

/**
 * Role-Based Access Control middleware factory.
 * Usage: router.get('/audit', verifyJWT, requireRole('admin'), handler)
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
