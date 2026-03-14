import { createClient } from "@supabase/supabase-js";
import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../types/index.js";

// admin db client
const verifyClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

export async function verifyJWT(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Authorization header missing or malformed.",
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  const token = authHeader.replace("Bearer ", "").trim();

  const {
    data: { user },
    error,
  } = await verifyClient.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "JWT token is invalid or expired.",
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // check true role
  const { data: profile } = await verifyClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message: "User profile not found. Please complete registration.",
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  const authedReq = req as AuthenticatedRequest;
  authedReq.userId = user.id;
  authedReq.userEmail = user.email ?? "";
  authedReq.role = profile.role as AuthenticatedRequest["role"];

  next();
}
