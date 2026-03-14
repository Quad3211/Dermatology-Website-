import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { HttpError } from "../middleware/errorHandler.js";
import { analyzeSkinWithGemini } from "../services/geminiService.js";
import { applySafetyGate } from "../services/medicalSafety.js";

export const publicRouter = Router();

const publicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Public scan rate limit reached. Please wait 15 minutes.",
    },
  },
});

// public scan payload
const PublicScanSchema = z.object({
  base64Image: z
    .string()
    .min(1, "base64Image is required")
    .max(15 * 1024 * 1024, "Image data too large"), // ~10 MB base64
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"], {
    errorMap: () => ({
      message: "mimeType must be image/jpeg, image/png, or image/webp",
    }),
  }),
});

// run public scan
publicRouter.post(
  "/scan",
  publicRateLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // check input
      const parsed = PublicScanSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(
          422,
          "VALIDATION_ERROR",
          parsed.error.errors[0].message,
        );
      }

      const { base64Image, mimeType } = parsed.data;

      const aiResult = await analyzeSkinWithGemini(base64Image, mimeType);

      // run medical safety checks
      const safeResult = applySafetyGate(
        aiResult.summary,
        aiResult.risk_level,
        aiResult.confidence,
      );

      res.json({
        success: true,
        data: {
          risk_level: aiResult.risk_level,
          confidence: Math.round(aiResult.confidence * 1000) / 1000,
          severity_score: Math.round(aiResult.severity_score * 10) / 10,
          summary: safeResult.summary,
          disclaimer: safeResult.disclaimer,
          top_label: aiResult.top_label,
          bounding_box: aiResult.bounding_box || null,
          referral_required: safeResult.referralRequired,
          emergency_flag: safeResult.emergencyFlag,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);
