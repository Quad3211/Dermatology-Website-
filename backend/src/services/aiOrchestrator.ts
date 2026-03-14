import { supabase } from "./supabase.js";
import { auditLog } from "../middleware/auditLogger.js";
import { analyzeSkinWithGemini } from "./geminiService.js";
import { applySafetyGate } from "./medicalSafety.js";

interface PipelineJob {
  analysisId: string;
  uploadId: string;
  storagePath: string;
  userId: string;
}

// FIX: Time-box the entire AI pipeline to 90 seconds.
// If Gemini hangs or the download stalls, we mark the analysis as failed
// instead of leaving it stuck in "processing" indefinitely.
const PIPELINE_TIMEOUT_MS = 90_000;

/**
 * Triggers the AI analysis pipeline.
 * Updates analysis_results in real-time via direct DB writes.
 * Called fire-and-forget from the analysis route.
 */
export async function triggerAIPipeline(job: PipelineJob): Promise<void> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("AI pipeline timed out after 90 seconds")),
      PIPELINE_TIMEOUT_MS,
    ),
  );

  try {
    await Promise.race([runPipeline(job), timeout]);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Pipeline] Analysis FAILED:", err);
    await markFailed(job.analysisId, `AI pipeline error: ${errorMsg}`);
    await supabase
      .from("uploads")
      .update({ status: "failed" })
      .eq("id", job.uploadId);
  }
}

async function runPipeline(job: PipelineJob): Promise<void> {
  // 1. Mark as processing
  await supabase
    .from("analysis_results")
    .update({ status: "processing", started_at: new Date().toISOString() })
    .eq("id", job.analysisId);

  // 2. Download the image from Supabase Storage
  const { data: fileData, error: downloadErr } = await supabase.storage
    .from("skin-images")
    .download(job.storagePath);

  if (downloadErr || !fileData) {
    await markFailed(
      job.analysisId,
      "Could not download image for AI pipeline.",
    );
    return;
  }

  // 3. Convert image Blob to Base64
  const arrayBuffer = await fileData.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString("base64");

  const ext = job.storagePath.split(".").pop()?.toLowerCase();
  const mimeType =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  // 4. Call our local Gemini service directly
  const aiResult = await analyzeSkinWithGemini(base64Image, mimeType);

  // FIX: Apply the medical safety gate BEFORE persisting any AI output.
  // This strips diagnostic phrases ("you have cancer", etc.) and enforces
  // correct referral/emergency flags regardless of what Gemini returned.
  const safeResult = applySafetyGate(
    aiResult.summary,
    aiResult.risk_level,
    aiResult.confidence,
  );

  // 5. Update analysis_results to complete (using safety-gated values)
  await supabase
    .from("analysis_results")
    .update({
      status: "complete",
      progress: 100,
      risk_level: aiResult.risk_level,
      confidence: Math.round(aiResult.confidence * 1000) / 1000,
      severity_score: Math.round(aiResult.severity_score * 10) / 10,
      summary: safeResult.summary,
      disclaimer: safeResult.disclaimer,
      referral_required: safeResult.referralRequired,
      emergency_flag: safeResult.emergencyFlag,
      xai_metadata: aiResult.bounding_box
        ? { bounding_box: aiResult.bounding_box }
        : {},
      completed_at: new Date().toISOString(),
    })
    .eq("id", job.analysisId);

  // 6. Update upload status
  await supabase
    .from("uploads")
    .update({ status: "complete" })
    .eq("id", job.uploadId);

  // 7. Audit log
  await auditLog("analysis.complete", {
    userId: job.userId,
    resourceType: "analysis",
    resourceId: job.analysisId,
    metadata: {
      riskLevel: aiResult.risk_level,
      referralRequired: safeResult.referralRequired,
      emergencyFlag: safeResult.emergencyFlag,
      safetyWarningIssued: safeResult.warningIssued,
    },
  });

  if (safeResult.emergencyFlag) {
    await auditLog("analysis.emergency", {
      userId: job.userId,
      resourceType: "analysis",
      resourceId: job.analysisId,
      metadata: { riskLevel: aiResult.risk_level },
    });
  }
}

async function markFailed(
  analysisId: string,
  errorMessage: string,
): Promise<void> {
  await supabase
    .from("analysis_results")
    .update({ status: "failed", error_message: errorMessage })
    .eq("id", analysisId);
}
