import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { HttpError } from "../middleware/errorHandler.js";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn(
    "[Gemini Service] WARNING: GEMINI_API_KEY environment variable not set. Gemini integration will fail.",
  );
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export interface SkinAnalysisOutput {
  risk_level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  confidence: number;
  severity_score: number;
  top_label: string;
  summary: string;
  bounding_box?: {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
  } | null;
}

const analysisSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    risk_level: {
      type: SchemaType.STRING,
      description: "Must be one of: LOW, MODERATE, HIGH, CRITICAL",
      enum: ["LOW", "MODERATE", "HIGH", "CRITICAL"],
    },
    confidence: {
      type: SchemaType.NUMBER,
      description:
        "A float between 0.0 and 1.0 representing the AI's confidence.",
    },
    severity_score: {
      type: SchemaType.NUMBER,
      description: "A float between 0.0 and 10.0 representing the severity.",
    },
    top_label: {
      type: SchemaType.STRING,
      description:
        "The primary label. If disease, use medical term (e.g., 'melanoma', 'basal_cell_carcinoma', 'actinic_keratosis', 'benign_keratosis', 'dermatofibroma', 'vascular_lesion', 'squamous_cell_carcinoma', 'melanocytic_nevus'). If healthy/no visible disease, use 'healthy_skin'.",
    },
    summary: {
      type: SchemaType.STRING,
      description:
        "A text explanation. If a disease is detected, describe it and why it looks concerning, AND suggest treatment options (including OTC or natural remedies regardless of risk level). IF HEALTHY/NO DISEASE is visible, you MUST provide customized skincare tips based on the appearance of the skin (e.g., hydration, sun protection, routine advice).",
    },
    bounding_box: {
      type: SchemaType.OBJECT,
      description:
        "Optional bounding box strictly around the primary diseased area. Omit this field entirely if the skin is healthy.",
      properties: {
        ymin: {
          type: SchemaType.NUMBER,
          description: "Top edge coordinate (0 to 1000)",
        },
        xmin: {
          type: SchemaType.NUMBER,
          description: "Left edge coordinate (0 to 1000)",
        },
        ymax: {
          type: SchemaType.NUMBER,
          description: "Bottom edge coordinate (0 to 1000)",
        },
        xmax: {
          type: SchemaType.NUMBER,
          description: "Right edge coordinate (0 to 1000)",
        },
      },
      required: ["ymin", "xmin", "ymax", "xmax"],
    },
  },
  required: [
    "risk_level",
    "confidence",
    "severity_score",
    "top_label",
    "summary",
  ],
};

// Use the current GA stable model
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: analysisSchema,
  },
});

export async function analyzeSkinWithGemini(
  base64Image: string,
  mimeType: string,
): Promise<SkinAnalysisOutput> {
  const prompt =
    "You are an expert dermatology AI assistant. Analyze the provided image of human skin. " +
    "Your task is to either detect signs of skin disease OR provide general skincare tips if the skin appears healthy. " +
    "If you detect a disease, classify it (e.g., melanoma, basal_cell_carcinoma, etc.), assign a risk level, " +
    "severity score, and explain your findings in the summary. " +
    "CRITICAL: If a disease/lesion is detected, you MUST provide its tightest bounding box coordinates in the 'bounding_box' field, scaled from 0 to 1000 where [0,0] is top-left and [1000,1000] is bottom-right. " +
    "You MUST also suggest possible treatment options for all risk levels, including over-the-counter (OTC) products or natural remedies if appropriate. " +
    "If you DO NOT detect any visible disease, classify it as 'healthy_skin', set risk to LOW, severity to 0, omit the bounding box entirely, " +
    "and YOU MUST use the 'summary' field to provide helpful, personalized skincare tips based on the skin type, " +
    "texture, or context in the image (e.g., 'Your skin looks well hydrated. To maintain it, consider...'). " +
    "Respond with a strict JSON object following the instructed schema.";

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();

    try {
      return JSON.parse(text) as SkinAnalysisOutput;
    } catch {
      throw new HttpError(
        500,
        "AI_PARSE_ERROR",
        "AI returned a non-JSON response. Please try again.",
      );
    }
  } catch (error: any) {
    console.error("[Gemini Service] Error during API call:", error);

    // format rate limit errs
    if (
      error?.status === 429 ||
      error?.message?.includes("429") ||
      error?.message?.includes("Quota exceeded")
    ) {
      throw new HttpError(
        429,
        "RATE_LIMIT_EXCEEDED",
        "Google AI API rate limit exceeded. Please wait 1 minute and try again.",
      );
    }

    // handle standard errs
    throw new HttpError(
      500,
      "AI_SERVICE_ERROR",
      "Failed to analyze image with Google AI. Please try again.",
    );
  }
}
