import type { NextFunction, Request, Response } from "express";
import { supabase } from "../services/supabase.js";
import type { AuthenticatedRequest } from "../types/index.js";

// log every request, don't block
export function requestAuditLogger(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  // fire and forget log
  void logRequest(req);
  next();
}

async function logRequest(req: Request): Promise<void> {
  try {
    const authedReq = req as Partial<AuthenticatedRequest>;
    const event = deriveEvent(req.method, req.path);
    if (!event) return; // skip health pings

    await supabase.from("audit_logs").insert({
      user_id: authedReq.userId ?? null,
      event,
      resource_type: deriveResourceType(req.path),
      resource_id: extractIdFromPath(req.path),
      metadata: { method: req.method, path: req.path, query: req.query },
      ip_address: req.ip ?? null,
      user_agent: req.headers["user-agent"]
        ? String(req.headers["user-agent"])
        : null,
    });
  } catch (_err) {
    // ignore audit fails
  }
}

export async function auditLog(
  event: string,
  context: {
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  },
): Promise<void> {
  try {
    await supabase.from("audit_logs").insert({
      user_id: context.userId ?? null,
      event,
      resource_type: context.resourceType ?? null,
      resource_id: context.resourceId ?? null,
      metadata: context.metadata ?? {},
      ip_address: context.ipAddress ?? null,
      user_agent: context.userAgent ?? null,
    });
  } catch (_err) {
    // ignore audit fails
  }
}

function deriveEvent(method: string, path: string): string | null {
  if (path.includes("/health")) return null;
  const segments = path.split("/").filter(Boolean);
  const resource = segments[2] ?? "unknown"; // get resource name
  const actions: Record<string, Record<string, string>> = {
    uploads: { POST: "upload.created", GET: "upload.read" },
    analysis: { POST: "analysis.queued", GET: "analysis.read" },
    consultations: {
      POST: "consultation.created",
      GET: "consultation.read",
      PATCH: "consultation.updated",
    },
    audit: { GET: "audit.read" },
  };
  return actions[resource]?.[method] ?? `${resource}.${method.toLowerCase()}`;
}

function deriveResourceType(path: string): string | null {
  if (path.includes("/uploads")) return "upload";
  if (path.includes("/analysis")) return "analysis";
  if (path.includes("/consultations")) return "consultation";
  if (path.includes("/audit")) return "audit";
  return null;
}

function extractIdFromPath(path: string): string | null {
  // extract target uuid
  const uuidMatch = path.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  );
  return uuidMatch?.[0] ?? null;
}
