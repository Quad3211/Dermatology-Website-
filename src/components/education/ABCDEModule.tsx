import { motion } from "framer-motion";
import { AlertCircle, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { useState } from "react";
import { Button } from "../core/Button";

const steps = [
  {
    title: "A is for Asymmetry",
    description: "One half of a mole or birthmark doesn't match the other.",
    detail:
      "Normal moles are typically symmetrical. If you drew a line through the middle, both sides would look the same.",
    examples: ["Symmetrical (Safe)", "Asymmetrical (Warning)"],
  },
  {
    title: "B is for Border",
    description: "The edges are irregular, ragged, notched, or blurred.",
    detail:
      "Melanomas often have uneven borders. The edges may be scalloped or notched, while common moles have smoother, more even borders.",
    examples: ["Smooth Border", "Irregular Border"],
  },
  {
    title: "C is for Color",
    description: "The color is not the same all over.",
    detail:
      "Common moles are usually a single shade of brown. A melanoma may have different shades of brown, black, or even patches of pink, red, white, or blue.",
    examples: ["Single Color", "Multiple Colors"],
  },
  {
    title: "D is for Diameter",
    description:
      "The spot is larger than 6 millimeters across (about the size of a pencil eraser).",
    detail:
      "While melanomas can sometimes be smaller, most are larger than 6mm. Any growth in a mole should be evaluated.",
    examples: ["Under 6mm", "Over 6mm"],
  },
  {
    title: "E is for Evolving",
    description: "The mole is changing in size, shape, or color.",
    detail:
      "This is the most important factor. If a mole starts to grow, change shape, itch, or bleed, see a dermatologist immediately.",
    examples: ["Stable Mole", "Changing appearance"],
  },
];

export function ABCDEModule() {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
      <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6 text-white text-center">
        <h3 className="text-xl font-bold flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-200" />
          The ABCDE of Melanoma
        </h3>
        <p className="text-red-100 text-sm mt-1">
          A life-saving guide to spotting suspicious lesions
        </p>
      </div>

      <div className="p-8">
        <div className="flex justify-between mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 mx-1 rounded-full transition-colors ${
                i <= currentStep ? "bg-red-500" : "bg-slate-100"
              }`}
            />
          ))}
        </div>

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-[200px]"
        >
          <h4 className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tight">
            {steps[currentStep].title}
          </h4>
          <p className="text-slate-600 font-medium text-lg leading-relaxed mb-4">
            {steps[currentStep].description}
          </p>
          <div className="bg-slate-50 border-l-4 border-slate-300 p-4 rounded-r-xl mb-6 flex items-start gap-3">
            <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-slate-500 text-sm leading-relaxed italic">
              {steps[currentStep].detail}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-2">
            {steps[currentStep].examples.map((ex, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 p-3 rounded-xl text-center text-xs font-bold text-slate-500 shadow-sm"
              >
                {ex}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex justify-between items-center mt-8">
          <Button
            variant="ghost"
            onClick={prev}
            disabled={currentStep === 0}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Step {currentStep + 1} of {steps.length}
          </span>
          {currentStep === steps.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(0)}
              className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl px-6"
            >
              Finish Review
            </Button>
          ) : (
            <Button
              onClick={next}
              className="bg-red-600 text-white hover:bg-red-700 rounded-xl px-6 flex items-center gap-2 shadow-lg shadow-red-200"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
