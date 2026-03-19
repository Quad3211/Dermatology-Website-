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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
const model = genAI.getGenerativeModel(
  {
    model: "gemini-2.5-flash",
  },
  { apiVersion: "v1beta" },
);

// Configure model with generation settings
model.generationConfig = {
  responseMimeType: "application/json",
  responseSchema: analysisSchema,
};

export async function analyzeSkinWithGemini(
  base64Image: string,
  mimeType: string,
): Promise<SkinAnalysisOutput> {
  // sanitize: remove data url prefix if present
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

  const prompt =
    "You are an expert dermatology AI assistant. Analyze the provided image of human skin. " +
    "Your response MUST be a single JSON object. DO NOT include any markdown formatting like ```json or explainations outside the JSON. " +
    "Instructions: Detect signs of skin disease OR provide general skincare tips. " +
    "If disease is detected: classify it, assign risk level (LOW/MODERATE/HIGH/CRITICAL), severity score (0-10), and tightest bounding box scaled 0-1000. " +
    "If healthy: classify as 'healthy_skin', risk LOW, severity 0, and provide personalized skincare tips in the summary. " +
    "The summary MUST include treatment/OTC suggestions regardless of risk. " +
    `Schema: ${JSON.stringify(analysisSchema.properties)}`;

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    let text = response.text();

    // extract JSON from markdown if AI ignored instructions
    if (text.includes("```")) {
      text = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
    }

    try {
      return JSON.parse(text) as SkinAnalysisOutput;
    } catch {
      console.error("[Gemini Service] Failed to parse AI response:", text);
      throw new HttpError(
        500,
        "AI_PARSE_ERROR",
        "AI returned a malformed response. Please try again.",
      );
    }
  } catch (error: any) {
    if (error instanceof HttpError) throw error;

    console.error(
      `[Gemini Service] API Error (Status: ${error.status}):`,
      error.message,
    );

    // format rate limit errs
    const isRateLimit =
      error.status === 429 ||
      error.statusCode === 429 ||
      error.message?.toLowerCase().includes("quota exceeded") ||
      error.message?.toLowerCase().includes("resource_exhausted");

    if (isRateLimit) {
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
      `Failed to analyze image with Google AI: ${error.message || "Unknown error"}.`,
    );
  }
}
