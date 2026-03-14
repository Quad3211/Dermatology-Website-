import type { RiskLevel } from "../types/index.js";

const MANDATORY_DISCLAIMER =
  "THIS IS A RISK TRIAGE RESULT — NOT A MEDICAL DIAGNOSIS. " +
  "This tool is a decision-support aid only. " +
  "Always consult a qualified, registered dermatologist. " +
  "In an emergency, call 999 (UK) or 911 (US) immediately.";

// Phrases that must never appear in AI output summaries
const BANNED_PHRASES = [
  "you have",
  "you are diagnosed",
  "this is cancer",
  "this is melanoma",
  "malignant",
  "diagnosed with",
  "confirms cancer",
  "is cancerous",
];

export interface SafetyCheckResult {
  summary: string;
  disclaimer: string;
  referralRequired: boolean;
  emergencyFlag: boolean;
  warningIssued: boolean;
}

/**
 * Immutable medical safety gate.
 * Called by the AI pipeline before persisting any result.
 * This function cannot be disabled via config or API params.
 */
export function applySafetyGate(
  rawSummary: string,
  riskLevel: RiskLevel,
  confidence: number,
): SafetyCheckResult {
  // 1. Strip banned diagnostic phrases
  let cleanSummary = rawSummary;
  let warningIssued = false;

  for (const phrase of BANNED_PHRASES) {
    const regex = new RegExp(phrase, "gi");
    if (regex.test(cleanSummary)) {
      cleanSummary = cleanSummary.replace(regex, "[redacted]");
      warningIssued = true;
    }
  }

  // 2. Enforce referral on HIGH or CRITICAL
  const referralRequired = riskLevel === "HIGH" || riskLevel === "CRITICAL";

  // 3. Enforce emergency flag on CRITICAL
  const emergencyFlag = riskLevel === "CRITICAL";

  // 4. Append mandatory disclaimer to summary
  const fullSummary = `${cleanSummary} — ${MANDATORY_DISCLAIMER}`;

  // 5. Validate confidence is in range (safety net)
  if (confidence < 0 || confidence > 1) {
    throw new Error(`Invalid confidence score: ${confidence}`);
  }

  return {
    summary: fullSummary,
    disclaimer: MANDATORY_DISCLAIMER,
    referralRequired,
    emergencyFlag,
    warningIssued,
  };
}

/** Returns the patient-facing urgency message for a given risk level */
export function getRiskMessage(riskLevel: RiskLevel): string {
  const messages: Record<RiskLevel, string> = {
    LOW: "Low risk detected. Continue to monitor and practice regular self-examination. No immediate action required.",
    MODERATE:
      "Moderate risk detected. We recommend visiting your GP within the next 4 weeks for a professional assessment.",
    HIGH: "High risk detected. Please book a dermatologist consultation as soon as possible. A doctor has been notified to review your case.",
    CRITICAL:
      "CRITICAL risk detected. Please seek urgent medical attention immediately. Call 999 (UK) or 911 (US) if you have any concerns. A doctor has been alerted.",
  };
  return messages[riskLevel];
}

/** Returns emergency contact info for CRITICAL results */
export function getEmergencyInfo(): { numbers: string[]; message: string } {
  return {
    numbers: ["999", "111", "911"],
    message:
      "CRITICAL risk level detected. Please seek emergency medical care or call your local emergency services immediately. Do not delay.",
  };
}
