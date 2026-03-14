import { useState, useMemo } from "react";
import { Card, CardContent } from "../../components/core/Card";
import {
  BookOpen,
  Info,
  Search,
  ChevronDown,
  Activity,
  AlertCircle,
  Sun,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const categories = [
  "All",
  "Skin Cancer",
  "Daily Prevention",
  "Common Conditions",
  "Procedures",
];

const resources = [
  {
    id: 1,
    category: "Skin Cancer",
    title: "Understanding Melanoma (The ABCDEs)",
    description:
      "Melanoma is the most dangerous form of skin cancer. Learn the ABCDEs for early detection.",
    content:
      "The ABCDE rule is a helpful guide for catching melanoma early:\n\n• Asymmetry: One half of the mole does not match the other.\n• Border: The edges are irregular, ragged, notched, or blurred.\n• Color: The color is not the same all over and may include different shades of brown or black, or sometimes with patches of pink, red, white, or blue.\n• Diameter: The spot is larger than 6 millimeters across (about the size of a pencil eraser), although melanomas can sometimes be smaller than this.\n• Evolving: The mole is changing in size, shape, or color.\n\nIf you notice any of these signs, have it evaluated by a dermatologist immediately.",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  {
    id: 2,
    category: "Skin Cancer",
    title: "Basal & Squamous Cell Carcinomas",
    description:
      "The most common and highly treatable forms of skin cancer. Identify the warning signs.",
    content:
      "Basal Cell Carcinoma (BCC) often appears as a slightly transparent bump on the skin, though it can take other forms. It occurs most often on areas of the skin that are exposed to the sun.\n\nSquamous Cell Carcinoma (SCC) usually appears as a firm, red nodule or a flat lesion with a scaly, crusted surface. Both are highly treatable when caught early but can cause significant local tissue damage if ignored. Prevention includes daily sun protection.",
    icon: Activity,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    id: 3,
    category: "Daily Prevention",
    title: "Sun Safety & Daily UV Protection",
    description:
      "Daily habits to protect your skin from harmful UV radiation and prevent premature aging.",
    content:
      "Sun protection is the foundation of skin health:\n\n1. Sunscreen: Apply a broad-spectrum, water-resistant sunscreen with an SPF of 30 or higher every day, even when it's cloudy.\n2. Reapplication: Reapply sunscreen every two hours, or immediately after swimming or sweating.\n3. Cover Up: Wear UPF (Ultraviolet Protection Factor) clothing, wide-brimmed hats, and UV-blocking sunglasses.\n4. Seek Shade: Avoid direct sun exposure during peak hours, typically between 10 AM and 4 PM.\n\nConsistent sun protection dramatically reduces your risk of all skin cancers and protects against photoaging.",
    icon: Sun,
    color: "text-amber-500",
    bgColor: "bg-amber-100",
  },
  {
    id: 4,
    category: "Common Conditions",
    title: "Managing Acne Vulgaris",
    description:
      "Understand the causes of acne and evidence-based treatments to clear your skin.",
    content:
      "Acne occurs when hair follicles become plugged with oil and dead skin cells. Factors like hormones, stress, and diet can exacerbate it.\n\nCommon treatments include:\n• Salicylic Acid: Helps unclog pores.\n• Benzoyl Peroxide: Kills acne-causing bacteria.\n• Retinoids: Speeds up cell turnover to prevent clogged pores.\n\nDo not pop pimples, as this increases inflammation and the risk of permanent scarring. A dermatologist can prescribe stronger topical or oral medications for persistent cases.",
    icon: ShieldCheck,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
  {
    id: 5,
    category: "Common Conditions",
    title: "Eczema (Atopic Dermatitis) Care",
    description:
      "Identify eczema triggers and learn how to restore your skin's natural barrier.",
    content:
      "Eczema makes your skin red, inflamed, and extremely itchy. It's related to a gene variation that affects the skin's ability to provide protection, leaving it affected by environmental factors, irritants, and allergens.\n\nManagement:\n• Bathe in warm (not hot) water for 10-15 minutes max.\n• Apply thick emollients/ceramide creams immediately after bathing to lock in moisture.\n• Use gentle, fragrance-free soaps and detergents.\n• During flare-ups, topical corticosteroids prescribed by a doctor can rapidly reduce inflammation.",
    icon: BookOpen,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    id: 6,
    category: "Procedures",
    title: "What to Expect During a Skin Biopsy",
    description:
      "A step-by-step walkthrough of a standard dermatological biopsy procedure and post-care.",
    content:
      "If your doctor sees a suspicious lesion, they may perform a biopsy. This is a quick outpatient procedure.\n\n1. Numbing: A local anesthetic (like lidocaine) is injected around the site. This stings briefly.\n2. Removal: The doctor removes a small sample using a shave (scalpel slice parallel to skin), punch (circular tool), or excision (surgical removal).\n3. Hemostasis/Closure: Bleeding is stopped, sometimes requiring a suture.\n4. Aftercare: Keep the area clean, covered with Vaseline/Aquaphor, and bandaged. It usually heals within 1-2 weeks. The sample is sent to a dermatopathologist for microscope analysis.",
    icon: Info,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
];

export function EducationView() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchesCategory =
        activeCategory === "All" || r.category === activeCategory;
      const matchesSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Patient Education Center
        </h1>
        <p className="mt-2 text-lg text-slate-600 font-medium">
          Curated clinical resources verified by board-certified dermatologists.
          Empower yourself with accurate skin health knowledge.
        </p>
      </div>

      {/* Interactive Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search for conditions, treatments, or symptoms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 transition-shadow"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeCategory === cat
                  ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-primary-300 hover:text-primary-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resources List */}
      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {filteredResources.map((resource) => {
            const isExpanded = expandedId === resource.id;
            const Icon = resource.icon;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                key={resource.id}
              >
                <Card
                  className={`border-slate-200 overflow-hidden transition-all duration-300 ${
                    isExpanded
                      ? "ring-2 ring-primary-500 shadow-lg"
                      : "hover:border-primary-300 hover:shadow-md cursor-pointer"
                  }`}
                  onClick={() => setExpandedId(isExpanded ? null : resource.id)}
                >
                  <CardContent className="p-0">
                    <div className="p-6 flex items-start space-x-4">
                      <div
                        className={`p-3 rounded-xl flex-shrink-0 ${resource.bgColor} ${resource.color}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {resource.category}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1.5 leading-tight">
                          {resource.title}
                        </h3>
                        <p
                          className={`text-slate-600 text-sm leading-relaxed ${isExpanded ? "line-clamp-none" : "line-clamp-2"}`}
                        >
                          {resource.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 mt-2">
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="w-6 h-6 text-slate-400" />
                        </motion.div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50">
                            <h4 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">
                              Clinical Details
                            </h4>
                            <div className="prose prose-sm prose-slate max-w-none">
                              {resource.content
                                .split("\n")
                                .map((paragraph, i) => (
                                  <p
                                    key={i}
                                    className="mb-2 text-slate-700 leading-relaxed font-medium"
                                  >
                                    {paragraph}
                                  </p>
                                ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredResources.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300"
          >
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              No results found
            </h3>
            <p className="text-slate-500 font-medium">
              We couldn't find any articles matching "{searchQuery}".
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("All");
              }}
              className="mt-6 text-primary-600 font-bold hover:text-primary-700"
            >
              Clear filters
            </button>
          </motion.div>
        )}
      </div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 shadow-xl text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNHYtbDItMiAyaDZWMTJoLTZsLTIgMi0yLTJINHYxaDF2MmgtMXYxSDB2MmgyLjlsMiAySDF2Mmg0LjVsLTIgMkgwdjJoOGw2LTV2LTJsLTItMnYtMmwtMi0ydjJIMXYtMmgtMXYyaDBWMTRoMTB2MTJoNHYtaDR2LTEwaDR2MmgtdjJoLXYxMGg0djEySDM2ek02IDIyaDd2Mkg2em0xMC0ydjFoOHYtMWgtOHpNOCAxMmgtMWg0djJoLTR2MWg2di0yaC0xdjFIM3YtMWg1em04LTEwaDJ2MmgtMnptLTQgMmgtMnYyaDJWMDR6')] opacity-5" />
        <Info className="h-8 w-8 text-primary-400 mx-auto mb-4 relative z-10" />
        <h4 className="text-white font-bold mb-2 text-xl relative z-10">
          Need specific information?
        </h4>
        <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-lg mx-auto relative z-10">
          During your secure consultation, your assigned board-certified doctor
          will provide tailored clinical reading materials mapped exactly to
          your diagnosis and treatment plan.
        </p>
      </motion.div>
    </div>
  );
}
