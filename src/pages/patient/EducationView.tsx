import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Filter,
  Lightbulb,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/core/Button";
import { Card, CardContent } from "../../components/core/Card";
import { ABCDEModule } from "../../components/education/ABCDEModule";
import { VisualSymptomGallery } from "../../components/education/VisualSymptomGallery";
import { supabase } from "../../config/supabase";

const categories = [
  "All",
  "Skin Cancer",
  "Daily Prevention",
  "Common Conditions",
  "Procedures",
];

const articles = [
  {
    id: 1,
    category: "Skin Cancer",
    title: "Understanding Melanoma",
    description:
      "Learn about the most dangerous form of skin cancer and how to detect it early.",
    content:
      "Melanoma is the most serious type of skin cancer. It develops in the cells (melanocytes) that produce melanin — the pigment that gives your skin its color. Early detection is key to survival. The ABCDE rule is a helpful guide: Asymmetry, Border, Color, Diameter, and Evolving. Any lesion that grows, changes shape, or bleeds should be examined by a dermatologist immediately.",
    tags: ["High Risk", "Clinical"],
  },
  {
    id: 2,
    category: "Daily Prevention",
    title: "The Ultimate Guide to SPF",
    description:
      "Everything you need to know about broad-spectrum protection and daily UV habits.",
    content:
      "Sunscreen is one of your best defenses against skin cancer and premature aging. Look for 'broad-spectrum' on the label to ensure protection against both UVA and UVB rays. You should apply at least SPF 30 every single day, including cloudy days, as UV rays penetrate through cloud cover. Reapply every two hours when outdoors.",
    tags: ["Prevention", "Daily"],
  },
  {
    id: 3,
    category: "Common Conditions",
    title: "Managing Adult Acne",
    description:
      "Evidence-based treatments for persistent adult acne and hormonal breakouts.",
    content:
      "Adult acne is often caused by a combination of fluctuating hormones, stress, and environmental factors. Unlike teenage acne, it's often deeper and more inflammatory. Treatments often include retinoids for cell turnover, benzoyl peroxide for bacterial control, and salicylic acid for pore cleansing. Consistency is vital, as most treatments take 8-12 weeks to show significant results.",
    tags: ["Acne", "Treatment"],
  },
  {
    id: 4,
    category: "Procedures",
    title: "Skin Biopsy: What to Expect",
    description:
      "A guide to the process, pain management, and healing for skin biopsies.",
    content:
      "A skin biopsy is a procedure where a doctor removes a small sample of skin to test for conditions. It's usually performed under local anesthesia, so you'll feel a tiny pinch followed by numbness. Afterward, you'll need to keep the area clean and apply petroleum jelly. Results typically take 7-10 days.",
    tags: ["Clinical", "Testing"],
  },
];

export function EducationView() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  useEffect(() => {
    async function fetchLatestScan() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("uploads")
        .select(
          `
          analysis:analysis_results(risk_level, summary)
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data?.analysis) {
        setLatestAnalysis(
          Array.isArray(data.analysis) ? data.analysis[0] : data.analysis,
        );
      }
    }
    fetchLatestScan();
  }, []);

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const matchesCategory =
        activeCategory === "All" || a.category === activeCategory;
      const matchesSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 px-4">
      {/* Hero Section */}
      <section className="relative pt-8 pb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent -z-10 rounded-3xl" />
        <div className="max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight"
          >
            Digital <span className="text-primary-600">Dermatology</span> <br />
            Learning Hub
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-xl text-slate-600 font-medium leading-relaxed"
          >
            Empowering your skin health journey with AI-driven insights and
            verified clinical resources.
          </motion.p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          {latestAnalysis && (
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                <h2 className="text-xl font-bold text-slate-900">
                  Recommended for You
                </h2>
              </div>
              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-none text-white overflow-hidden group">
                <CardContent className="p-8 relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BookOpen className="w-24 h-24" />
                  </div>
                  <div className="relative z-10">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-2 block">
                      Based on your latest scan
                    </span>
                    <h3 className="text-2xl font-bold mb-4">
                      {latestAnalysis.risk_level === "CRITICAL" ||
                      latestAnalysis.risk_level === "HIGH"
                        ? "Urgent: Understanding High-Risk Lesions"
                        : "Deep Dive: Preventive Skin Care Routine"}
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-6 max-w-md">
                      Our system has analyzed your recent capture. We recommend
                      reviewing these clinical modules to better understand your
                      specific skin profile.
                    </p>
                    <button
                      onClick={() =>
                        setSelectedArticle(
                          articles[
                            latestAnalysis.risk_level === "CRITICAL" ||
                            latestAnalysis.risk_level === "HIGH"
                              ? 0
                              : 1
                          ],
                        )
                      }
                      className="flex items-center gap-2 font-bold text-white hover:text-primary-400 transition-colors"
                    >
                      Start Personalized Module{" "}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          <section>
            <VisualSymptomGallery />
          </section>

          <section>
            <ABCDEModule />
          </section>
        </div>

        <div className="space-y-8">
          <Card className="bg-primary-50 border-primary-100 border shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="bg-primary-100 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-6 h-6 text-primary-600" />
              </div>
              <h4 className="text-primary-900 font-bold mb-2">
                Daily Skin Tip
              </h4>
              <p className="text-primary-700 text-xs leading-relaxed font-semibold italic">
                "Apply sunscreen even when it's cloudy. Up to 80% of the sun's
                harmful UV rays can penetrate through clouds."
              </p>
            </CardContent>
          </Card>

          <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filter Resources
            </h3>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeCategory === cat
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-200"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="pt-4 space-y-4">
              <AnimatePresence>
                {filteredArticles.map((article) => (
                  <motion.div
                    key={article.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group cursor-pointer p-3 -mx-3 rounded-2xl hover:bg-slate-50 transition-colors"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                      {article.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                      {article.description}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {article.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[8px] uppercase font-black text-slate-400 tracking-tighter"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <h3 className="text-lg font-bold text-slate-800">
                Doctor Prescribed
              </h3>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed mb-4">
              After your consultation, your doctor will add specific reading
              materials here.
            </p>
            <div className="bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-300 text-center">
              <span className="text-slate-400 text-xs font-bold italic">
                No active prescriptions
              </span>
            </div>
          </section>
        </div>
      </div>

      {/* Article Detail Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedArticle(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="p-8 md:p-12">
                <span className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-4 block">
                  {selectedArticle.category}
                </span>
                <h2 className="text-3xl font-black text-slate-900 mb-6 leading-tight">
                  {selectedArticle.title}
                </h2>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-600 text-lg leading-relaxed font-medium">
                    {selectedArticle.content}
                  </p>
                </div>

                <div className="mt-12 flex flex-wrap gap-2">
                  {selectedArticle.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-500 rounded-lg"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end">
                  <Button
                    onClick={() => setSelectedArticle(null)}
                    className="rounded-xl px-8"
                  >
                    Back to Resources
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
