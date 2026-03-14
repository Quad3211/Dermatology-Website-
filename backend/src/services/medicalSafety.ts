import type { RiskLevel } from "../types/index.js";

const MANDATORY_DISCLAIMER =
  "THIS IS A RISK TRIAGE RESULT — NOT A MEDICAL DIAGNOSIS. " +
  "This tool is a decision-support aid only. " +
  "Always consult a qualified, registered dermatologist. " +
  "In an emergency, call 999 (UK) or 911 (US) immediately.";

// banned diagnostics
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
 * safety gate function
 */
export function applySafetyGate(
  rawSummary: string,
  riskLevel: RiskLevel,
  confidence: number,
): SafetyCheckResult {
  // omit banned words
  let cleanSummary = rawSummary;
  let warningIssued = false;

  for (const phrase of BANNED_PHRASES) {
    const regex = new RegExp(phrase, "gi");
    if (regex.test(cleanSummary)) {
      cleanSummary = cleanSummary.replace(regex, "[redacted]");
      warningIssued = true;
    }
  }

  // require referral
  const referralRequired = riskLevel === "HIGH" || riskLevel === "CRITICAL";

  // require emergency flag
  const emergencyFlag = riskLevel === "CRITICAL";

  // combine with disclaimer
  const fullSummary = `${cleanSummary} — ${MANDATORY_DISCLAIMER}`;

  // check confidence bounds
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

/** get risk messaging */
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

/** get 911 info */
export function getEmergencyInfo(): { numbers: string[]; message: string } {
  return {
    numbers: ["999", "111", "911"],
    message:
      "CRITICAL risk level detected. Please seek emergency medical care or call your local emergency services immediately. Do not delay.",
  };
}
