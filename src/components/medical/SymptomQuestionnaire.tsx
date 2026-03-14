import {
  Activity,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  MapPin,
  MessageSquare,
  Thermometer,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { cn } from "../../utils/cn";
import { Button } from "../core/Button";

// types

export interface SymptomData {
  symptomType: string;
  symptomTypeOther: string;
  duration: string;
  durationOther: string;
  painLevel: string;
  sensations: string;
  sensationsOther: string;
  changes: string;
  changesOther: string;
  additionalContext: string;
}

interface Props {
  onComplete: (data: SymptomData) => void;
}

// option sets

const SYMPTOM_TYPES = [
  "Rash or irritated skin",
  "Mole / growth / lump",
  "Dryness or flaking",
  "Wound or open sore",
  "Itching without visible rash",
  "Discolouration or pigment change",
  "Blistering or fluid-filled lesion",
  "Acne or cyst",
  "Other",
];

const DURATIONS = [
  "Less than 1 week",
  "1 – 4 weeks",
  "1 – 3 months",
  "3 – 6 months",
  "More than 6 months",
  "Other",
];

const PAIN_LEVELS = [
  "0 – No discomfort at all",
  "1-2 – Very mild, easy to ignore",
  "3-4 – Mild, noticeable but not disruptive",
  "5-6 – Moderate, somewhat distracting",
  "7-8 – Severe, hard to ignore",
  "9-10 – Extreme, unbearable",
];

const SENSATIONS = [
  "No unusual sensation",
  "Itching",
  "Burning",
  "Stinging or prickling",
  "Numbness or tingling",
  "Tenderness when touched",
  "Throbbing",
  "Other",
];

const CHANGES = [
  "No noticeable change",
  "It has grown larger",
  "The colour has changed",
  "It has started bleeding or oozing",
  "New spots have appeared nearby",
  "It has become itchier or more painful",
  "It crusted over or formed a scab",
  "Other",
];

const BODY_PARTS = [
  "Face",
  "Scalp / hairline",
  "Neck",
  "Chest / upper torso (front)",
  "Back / upper torso (back)",
  "Abdomen",
  "Shoulder",
  "Upper arm",
  "Forearm / wrist",
  "Hand / fingers",
  "Hip / groin",
  "Thigh",
  "Knee",
  "Lower leg / shin",
  "Ankle / foot / toes",
  "Genital or private area",
  "Other",
];

// step config

interface StepConfig {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  field: keyof SymptomData;
  otherField?: keyof SymptomData;
  options: string[];
  isTextarea?: boolean;
}

const STEPS: StepConfig[] = [
  {
    id: "symptomType",
    icon: <ClipboardList className="h-5 w-5" />,
    title: "What describes your concern?",
    description:
      "Select the option that best matches what you are experiencing. Choose \u2018Other\u2019 to describe something not listed.",
    field: "symptomType",
    otherField: "symptomTypeOther",
    options: SYMPTOM_TYPES,
  },
  {
    id: "duration",
    icon: <Clock className="h-5 w-5" />,
    title: "How long have you had this?",
    description:
      "Knowing the duration helps the AI distinguish acute reactions from chronic conditions.",
    field: "duration",
    otherField: "durationOther",
    options: DURATIONS,
  },
  {
    id: "painLevel",
    icon: <Thermometer className="h-5 w-5" />,
    title: "How would you rate your discomfort?",
    description:
      "Select the level that best represents how discomfort is affecting you right now.",
    field: "painLevel",
    options: PAIN_LEVELS,
  },
  {
    id: "sensations",
    icon: <Activity className="h-5 w-5" />,
    title: "What sensations are you experiencing?",
    description:
      "Select the sensation that most closely matches what you feel in or around the affected area.",
    field: "sensations",
    otherField: "sensationsOther",
    options: SENSATIONS,
  },
  {
    id: "changes",
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Has the area changed recently?",
    description:
      "Recent changes can indicate progression. Be as accurate as possible.",
    field: "changes",
    otherField: "changesOther",
    options: CHANGES,
  },
  {
    id: "additionalContext",
    icon: <MessageSquare className="h-5 w-5" />,
    title: "Anything else you'd like to add?",
    description:
      "Tell the AI anything else about your condition — recent triggers, medications, allergies, family history, etc. This is optional but very helpful.",
    field: "additionalContext",
    options: [],
    isTextarea: true,
  },
];

// empty state

const EMPTY: SymptomData = {
  symptomType: "",
  symptomTypeOther: "",
  duration: "",
  durationOther: "",
  painLevel: "",
  sensations: "",
  sensationsOther: "",
  changes: "",
  changesOther: "",
  additionalContext: "",
};

// component

export function SymptomQuestionnaire({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<SymptomData>(EMPTY);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const step = STEPS[currentStep];
  const totalSteps = STEPS.length;
  const progressPct = Math.round((currentStep / totalSteps) * 100);

  const currentValue = data[step.field] as string;
  const otherValue = step.otherField ? (data[step.otherField] as string) : "";
  const isOtherSelected = currentValue === "Other";

  const isCurrentStepValid = (): boolean => {
    if (step.isTextarea) return true; // optional
    if (!currentValue) return false;
    if (isOtherSelected && step.otherField && !otherValue.trim()) return false;
    return true;
  };

  const transition = (forward: boolean, action: () => void) => {
    setDirection(forward ? "forward" : "back");
    setAnimating(true);
    setTimeout(() => {
      action();
      setAnimating(false);
    }, 220);
  };

  const handleNext = () => {
    if (!isCurrentStepValid()) return;
    if (currentStep < totalSteps - 1) {
      transition(true, () => setCurrentStep((s) => s + 1));
    } else {
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      transition(false, () => setCurrentStep((s) => s - 1));
    }
  };

  const setField = (field: keyof SymptomData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* progress header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-xs text-slate-400">
            {progressPct}% complete
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {/* Step dots */}
        <div className="flex items-center gap-1.5 mt-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === currentStep
                  ? "w-6 bg-primary-500"
                  : i < currentStep
                    ? "w-1.5 bg-primary-300"
                    : "w-1.5 bg-slate-200",
              )}
            />
          ))}
        </div>
      </div>

      {/* question card */}
      <div
        className={cn(
          "bg-white border border-surface-border rounded-2xl shadow-sm overflow-hidden transition-all duration-220",
          animating && direction === "forward" && "opacity-0 translate-x-4",
          animating && direction === "back" && "opacity-0 -translate-x-4",
          !animating && "opacity-100 translate-x-0",
        )}
        style={{ transition: "opacity 0.22s ease, transform 0.22s ease" }}
      >
        {/* Card header */}
        <div className="bg-gradient-to-r from-primary-50 to-slate-50 border-b border-surface-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-100 text-primary-600">
              {step.icon}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {step.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {step.description}
              </p>
            </div>
          </div>
        </div>

        {/* Card body */}
        <div className="px-6 py-6 space-y-4">
          {step.isTextarea ? (
            /* Free-text only step */
            <textarea
              id={`field-${step.id}`}
              rows={5}
              value={currentValue}
              onChange={(e) => setField(step.field, e.target.value)}
              placeholder="e.g. I recently changed my skincare routine, I take antihistamines daily, similar skin conditions run in my family…"
              className="w-full rounded-lg border border-surface-border bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none transition"
            />
          ) : (
            <>
              {/* Dropdown */}
              <div>
                <label
                  htmlFor={`select-${step.id}`}
                  className="block text-xs font-medium text-slate-600 mb-1.5"
                >
                  Select an option
                </label>
                <div className="relative">
                  <select
                    id={`select-${step.id}`}
                    value={currentValue}
                    onChange={(e) => {
                      setField(step.field, e.target.value);
                      // Clear the "other" text when switching away from Other
                      if (step.otherField && e.target.value !== "Other") {
                        setField(step.otherField, "");
                      }
                    }}
                    className="w-full appearance-none rounded-lg border border-surface-border bg-white px-4 py-3 pr-10 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition cursor-pointer"
                  >
                    <option value="" disabled>
                      — Please choose —
                    </option>
                    {step.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {/* Chevron icon */}
                  <ChevronRight className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* "Other" free-text expander */}
              {isOtherSelected && step.otherField && (
                <div className="rounded-lg border border-primary-200 bg-primary-50 p-4 space-y-2 animate-fadeIn">
                  <label
                    htmlFor={`other-${step.id}`}
                    className="block text-xs font-medium text-primary-700"
                  >
                    Please describe your answer
                  </label>
                  <input
                    id={`other-${step.id}`}
                    type="text"
                    value={otherValue}
                    onChange={(e) => setField(step.otherField!, e.target.value)}
                    placeholder="Type your answer here…"
                    maxLength={200}
                    className="w-full rounded-md border border-primary-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 transition"
                  />
                  <p className="text-right text-xs text-slate-400">
                    {otherValue.length}/200
                  </p>
                </div>
              )}

              {/* Validation hint */}
              {!isCurrentStepValid() && currentValue !== "" && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <span>⚠</span> Please describe your answer in the field above.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* prev/next buttons */}
      <div className="flex items-center justify-between mt-5">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        <Button
          onClick={handleNext}
          disabled={!isCurrentStepValid() && !step.isTextarea}
          className="gap-1.5 min-w-[130px]"
        >
          {currentStep < totalSteps - 1 ? (
            <>
              Next
              <ChevronRight className="h-4 w-4" />
            </>
          ) : (
            "Continue to Upload"
          )}
        </Button>
      </div>

      {/* skip hint on last step */}
      {currentStep === totalSteps - 1 && (
        <p className="text-center text-xs text-slate-400 mt-3">
          This step is optional — you can leave it blank and click "Continue to
          Upload".
        </p>
      )}
    </div>
  );
}
