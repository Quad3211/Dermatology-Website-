import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../components/core/Button";
import { ImageUploader } from "../../components/medical/ImageUploader";
import { RiskAssessmentWidget } from "../../components/medical/RiskAssessmentWidget";
import { SkinBodyMap } from "../../components/medical/SkinBodyMap";
import { SymptomQuestionnaire } from "../../components/medical/SymptomQuestionnaire";
import { ScanningAnimation } from "../../components/shared/ScanningAnimation";
import { supabase } from "../../config/supabase";
import {
  api,
  type AnalysisResponse,
  type RiskLevel,
  type SymptomData,
} from "../../services/api";

export function UploadFlow() {
  const [step, setStep] = useState<
    "QUESTIONNAIRE" | "UPLOAD" | "ANALYSING" | "RESULTS" | "ERROR"
  >("QUESTIONNAIRE");
  const [statusText, setStatusText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [symptomData, setSymptomData] = useState<SymptomData | null>(null);

  const handleQuestionnaireComplete = (data: SymptomData) => {
    setSymptomData(data);
    setStep("UPLOAD");
  };

  // fake scan animation
  useEffect(() => {
    if (step !== "ANALYSING") return;

    setScanProgress(0); // Start at 0
    const interval = setInterval(() => {
      setScanProgress((p) => {
        // ease progress
        if (p >= 95) return 95;
        return p + Math.random() * 5 + 2;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [step]);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setStep("ANALYSING");
    setAnalysisResult(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setErrorMsg("");
    setStatusText("Connecting securely to storage...");

    try {
      // get auth user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in. Please log in and try again.");

      // create db record
      setStatusText("Creating secure upload record..."); // Fake 10%
      setScanProgress(10);
      const { data: uploadRecord, error: insertErr } = await supabase
        .from("uploads")
        .insert({
          user_id: user.id,
          filename: file.name,
          mime_type: file.type as "image/jpeg" | "image/png" | "image/webp",
          size_bytes: file.size,
          body_part: "unspecified",
          status: "pending",
          storage_path: "", // updated later
          expires_at: new Date(
            Date.now() + 90 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        })
        .select("id")
        .single();

      if (insertErr || !uploadRecord) {
        throw new Error(
          insertErr?.message ?? "Failed to create upload record.",
        );
      }

      const uploadId = uploadRecord.id as string;
      const storagePath = `${user.id}/${uploadId}/${file.name}`;

      // save to storage
      setStatusText("Encrypting and uploading image...");
      setScanProgress(25);
      const { error: storageErr } = await supabase.storage
        .from("skin-images")
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (storageErr) throw new Error(storageErr.message);

      // update status
      setStatusText("Securing upload record...");
      setScanProgress(40);
      const { error: updateErr } = await supabase
        .from("uploads")
        .update({ storage_path: storagePath, status: "uploaded" })
        .eq("id", uploadId);

      if (updateErr) throw new Error(updateErr.message);

      // start ai poll
      setStatusText("Submitting image for AI analysis...");
      const queued = await api.analysis.trigger(
        uploadId,
        symptomData ?? undefined,
      );
      const result = await pollAnalysisResult(queued.analysisId, (latest) => {
        setStatusText(toStatusText(latest));
      });

      setAnalysisResult(result);
      setStatusText("Assessment complete.");
      setScanProgress(100);
      setStep("RESULTS");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      setErrorMsg(msg);
      setStep("ERROR");
    } finally {
      setIsUploading(false);
    }
  };
  const resolvedRiskLevel = analysisResult ? toRiskLevel(analysisResult) : null;
  const displaySummary = analysisResult
    ? toDisplaySummary(analysisResult.summary, analysisResult.disclaimer)
    : undefined;

  return (
    <div className="max-w-3xl mx-auto space-y-6 w-full fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">New Assessment</h1>
        <p className="text-slate-500 mt-1">
          {step === "QUESTIONNAIRE" &&
            "Tell us about your symptoms so the AI can give you a more accurate result."}
          {step === "UPLOAD" &&
            "Upload a clear, focused photo of your skin lesion. All data is end-to-end encrypted."}
          {step === "ANALYSING" &&
            "Please wait while we process your image through our secure triage engine."}
          {step === "RESULTS" &&
            "Analysis complete. Review your triage result and next steps."}
          {step === "ERROR" && "Something went wrong during upload."}
        </p>
      </div>

      <div className="mt-8 space-y-8">
        {step === "QUESTIONNAIRE" && (
          <SymptomQuestionnaire onComplete={handleQuestionnaireComplete} />
        )}

        {step === "UPLOAD" && (
          <>
            <ImageUploader onUpload={handleUpload} isUploading={isUploading} />
          </>
        )}

        {step === "ANALYSING" && previewUrl && (
          <ScanningAnimation
            imageUrl={previewUrl}
            isScanning={true}
            scanProgress={scanProgress}
            scanComplete={false}
            statusText={statusText}
          />
        )}

        {step === "RESULTS" && previewUrl && (
          <div className="mb-6">
            <ScanningAnimation
              imageUrl={previewUrl}
              isScanning={false}
              scanProgress={100}
              scanComplete={true}
              boundingBox={analysisResult?.xai_metadata?.bounding_box}
            />
          </div>
        )}

        {step === "RESULTS" && (
          <div className="space-y-6">
            {analysisResult && resolvedRiskLevel && (
              <RiskAssessmentWidget
                riskLevel={resolvedRiskLevel}
                confidence={toConfidencePercent(analysisResult)}
                summary={displaySummary}
                disclaimer={analysisResult.disclaimer}
              />
            )}
            {analysisResult && !resolvedRiskLevel && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800">
                  Risk level is unavailable for this analysis. Please retry or
                  contact support.
                </p>
              </div>
            )}

            <div
              className={`flex items-center gap-3 rounded-xl p-4 border ${
                isEmergency(analysisResult)
                  ? "bg-red-50 border-red-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              {isEmergency(analysisResult) ? (
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              )}
              <div>
                <p
                  className={`text-sm font-semibold ${
                    isEmergency(analysisResult)
                      ? "text-red-800"
                      : "text-green-800"
                  }`}
                >
                  {isEmergency(analysisResult)
                    ? "Urgent review required"
                    : "Analysis completed successfully"}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    isEmergency(analysisResult)
                      ? "text-red-700"
                      : "text-green-700"
                  }`}
                >
                  {isEmergency(analysisResult)
                    ? "Please seek immediate medical attention and contact emergency services if symptoms are severe."
                    : "You can now book a consultation with a dermatologist for clinical confirmation."}
                </p>
              </div>
            </div>
          </div>
        )}

        {step === "ERROR" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-800">{errorMsg}</p>
            </div>
            <Link to="/patient/consultation" className="block">
              <Button className="w-full">
                Request a Consultation Anyway
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                setStep("QUESTIONNAIRE");
                setErrorMsg("");
                setStatusText("");
                setAnalysisResult(null);
                setSymptomData(null);
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }}
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

const STAGE_SEQUENCE = [
  "validation",
  "preprocessing",
  "lesionDetection",
  "riskScoring",
  "explainability",
  "safetyGate",
] as const;

const STAGE_MESSAGES: Record<string, string> = {
  validation: "Validating image quality and metadata...",
  preprocessing: "Preprocessing image for model inference...",
  lesionDetection: "Detecting lesion structures...",
  riskScoring: "Scoring dermatology risk classes...",
  explainability: "Generating explainability overlays...",
  safetyGate: "Applying medical safety checks...",
};

async function pollAnalysisResult(
  analysisId: string,
  onUpdate: (result: AnalysisResponse) => void,
): Promise<AnalysisResponse> {
  const maxAttempts = 90; // poll timeout
  const pollMs = 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await api.analysis.getById(analysisId);
    onUpdate(result);

    if (result.status === "complete") return result;
    if (result.status === "failed") {
      const msg =
        result.errorMessage ??
        result.error_message ??
        "Analysis failed. Please try again.";
      throw new Error(msg);
    }

    await delay(pollMs);
  }

  throw new Error("Analysis timed out. Please try again.");
}

function toStatusText(result: AnalysisResponse): string {
  if (result.status === "queued") {
    return "Queued for AI analysis...";
  }

  if (result.status === "processing") {
    const stages = result.pipelineStages ?? result.pipeline_stages ?? {};
    const latestCompleted = [...STAGE_SEQUENCE]
      .reverse()
      .find((stage) => stages[stage] === "pass");

    if (latestCompleted) {
      return STAGE_MESSAGES[latestCompleted];
    }

    return "Analyzing dermatological image...";
  }

  if (result.status === "complete") {
    return "Assessment complete.";
  }

  return "Analysis failed.";
}

function toRiskLevel(result: AnalysisResponse): RiskLevel | null {
  const raw = result.riskLevel ?? result.risk_level;
  if (
    raw === "LOW" ||
    raw === "MODERATE" ||
    raw === "HIGH" ||
    raw === "CRITICAL"
  ) {
    return raw;
  }
  return null;
}

function toConfidencePercent(result: AnalysisResponse): number {
  const raw = result.confidence;
  if (typeof raw !== "number" || Number.isNaN(raw)) return 0;
  const percent = raw <= 1 ? raw * 100 : raw;
  return Number(Math.max(0, Math.min(100, percent)).toFixed(1));
}

function toDisplaySummary(
  summary: string | undefined,
  disclaimer: string | undefined,
): string | undefined {
  if (!summary) return undefined;
  if (!disclaimer) return summary.trim();

  const stripped = summary
    .replace(disclaimer, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return stripped || undefined;
}

function isEmergency(result: AnalysisResponse | null): boolean {
  if (!result) return false;
  return Boolean(result.emergencyFlag ?? result.emergency_flag);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
