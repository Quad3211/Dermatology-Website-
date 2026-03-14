import { Router } from "express";
import type { Response } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res: Response) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});
