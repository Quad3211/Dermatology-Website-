import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useState } from "react";

// Note: Using the absolute paths of generated images from previous steps
const conditions = [
  {
    id: "acne",
    name: "Acne Vulgaris",
    image: "/education/acne.png",
    identifiers: ["Whiteheads", "Blackheads", "Cysts"],
    description: "Plugged hair follicles and overactive oil glands.",
  },
  {
    id: "eczema",
    name: "Atopic Dermatitis",
    image: "/education/eczema.png",
    identifiers: ["Itchy", "Red Patches", "Dry/Scaly"],
    description: "Chronic inflammatory skin condition affecting the barrier.",
  },
  {
    id: "melanoma",
    name: "Melanoma",
    image: "/education/melanoma.png",
    identifiers: ["Irregular Borers", "Multi-colored", "Evolving"],
    description: "The most dangerous form of skin cancer, often pigmented.",
  },
  {
    id: "psoriasis",
    name: "Psoriasis",
    image: "/education/psoriasis.png",
    identifiers: ["Silvery Scales", "Thick Plaques", "Knee/Elbows"],
    description: "Autoimmune condition speeding up skin cell production.",
  },
  {
    id: "rosacea",
    name: "Rosacea",
    image: "/education/rosacea.png",
    identifiers: ["Facial Redness", "Visible Vessels", "Small Bumps"],
    description:
      "Common skin condition causing redness and visible blood vessels in your face.",
  },
];

export function VisualSymptomGallery() {
  const [search, setSearch] = useState("");

  const filtered = conditions.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.identifiers.some((id) =>
        id.toLowerCase().includes(search.toLowerCase()),
      ),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-slate-800 shrink-0">
          Visual Symptom Gallery
        </h3>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search symptoms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((condition) => (
          <motion.div
            layout
            key={condition.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group bg-white rounded-3xl overflow-hidden border border-slate-200 hover:shadow-xl transition-all duration-300"
          >
            <div className="aspect-square overflow-hidden bg-slate-100 relative">
              <img
                src={condition.image}
                alt={condition.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <h4 className="text-white font-bold text-lg">
                  {condition.name}
                </h4>
              </div>
            </div>

            <div className="p-5">
              <div className="flex flex-wrap gap-1.5 mb-3">
                {condition.identifiers.map((id, i) => (
                  <span
                    key={i}
                    className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 tracking-wider"
                  >
                    {id}
                  </span>
                ))}
              </div>
              <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                {condition.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
