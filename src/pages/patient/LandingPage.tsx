import { Link } from "react-router-dom";
import { Button } from "../../components/core/Button";
import {
  ShieldPlus,
  Activity,
  Clock,
  Shield,
  AlertTriangle,
  Stethoscope,
  Lock,
  ArrowRight,
  CheckCircle2,
  Search,
  Heart,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { PublicNavbar } from "../../components/shared/PublicNavbar";

// Animation Variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-primary-100 selection:text-primary-900 overflow-x-hidden">
      {/* Navbar directly integrated */}
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-slate-50 min-h-[90vh] flex items-center shadow-inner">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0 bg-slate-100">
          <img
            src="https://images.unsplash.com/photo-1576091160550-2173ff9e5ee5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2500&q=80"
            alt="Modern Health Tech"
            className="w-full h-full object-cover origin-center opacity-30 scale-105"
          />
          {/* Gradient overlay to make text pop */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/95 to-transparent mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center"
          >
            {/* Hero Copy */}
            <div className="max-w-2xl px-2">
              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-md text-primary-800 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-primary-200 shadow-sm"
              >
                <Activity className="w-4 h-4 text-primary-600 animate-pulse" />
                <span>AI-Assisted Skin Screening — Not a Diagnosis</span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1] drop-shadow-sm"
              >
                Understand Your Skin. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
                  Instantly &amp; Safely.
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg lg:text-xl text-slate-700 mb-8 leading-relaxed max-w-lg font-medium"
              >
                Upload a photo, receive an AI-powered risk screening, and
                connect with certified dermatologists if your condition warrants
                follow-up. Faster answers, less anxiety.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link to="/scan" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto hover:scale-105 transition-transform shadow-xl hover:shadow-primary-500/20 py-6 px-8 text-lg"
                  >
                    Start Free Screening <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <a href="#how-it-works" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto bg-white/50 backdrop-blur hover:bg-white shadow-sm py-6 px-8 border-slate-300"
                  >
                    See How It Works
                  </Button>
                </a>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="mt-10 flex flex-wrap items-center gap-6 text-sm text-slate-600 font-semibold bg-white/60 backdrop-blur p-4 rounded-xl border border-white/40 shadow-sm"
              >
                <div className="flex items-center">
                  <Lock className="w-4 h-4 mr-1.5 text-slate-500" /> HIPAA
                  Compliant
                </div>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-1.5 text-slate-500" /> Encrypted
                  &amp; Private
                </div>
                <div className="flex items-center">
                  <Heart className="w-4 h-4 mr-1.5 text-red-500" /> No Data
                  Sold. Ever.
                </div>
              </motion.div>
            </div>

            {/* Empty space on the right so the image shows through clearly on large screens */}
            <div className="hidden lg:block relative h-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, rotate: 2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white p-6 rounded-[2rem] shadow-2xl border border-slate-100 max-w-sm w-full backdrop-blur-md bg-white/90"
              >
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                    <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center">
                      <Activity className="text-primary-600 w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">
                        AI Screening Report
                      </div>
                      <div className="text-xs text-slate-500">
                        Processing complete
                      </div>
                    </div>
                  </div>
                  <div className="aspect-video bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden">
                    <Search className="w-8 h-8 text-primary-300 mb-2 absolute" />
                    <div className="h-1 w-full bg-primary-400 absolute top-1/2 left-0 shadow-[0_0_15px_rgba(14,165,233,0.5)] animate-scan" />
                  </div>
                  <div className="space-y-3">
                    <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between border border-slate-100">
                      <span className="text-sm font-medium text-slate-700">
                        Triage Priority
                      </span>
                      <div className="flex items-center text-status-warning font-bold text-sm">
                        <span className="w-2 h-2 rounded-full bg-status-warning mr-2" />{" "}
                        Moderate
                      </div>
                    </div>
                    <div className="bg-primary-50 text-primary-800 p-3 rounded-lg text-xs font-medium border border-primary-100 flex gap-2 items-start">
                      <Stethoscope className="w-4 h-4 shrink-0 mt-0.5" />A
                      licensed dermatologist is available to review this case
                      securely.
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Problem Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight"
            >
              Why Acting Early on Skin Concerns Matters
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-slate-600 font-medium"
            >
              Most people wait too long before seeking professional care — not
              because they don't care, but because the system makes it hard to
              know when to act.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid lg:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Clock,
                title: "Long Wait Times Create Uncertainty",
                text: "The average wait for a dermatology appointment can exceed 4 weeks. In the meantime, people are left guessing whether their concern is serious.",
              },
              {
                icon: AlertTriangle,
                title: "Delayed Care Can Have Consequences",
                text: "Skin conditions caught early are far easier to manage. Waiting can permit conditions to progress unnecessarily.",
              },
              {
                icon: Search,
                title: "Online Searches Create Anxiety",
                text: "Searching symptoms online without medical context frequently leads to confusion, fear, or self-misdiagnosis.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-slate-50 p-10 rounded-3xl border border-slate-100 hover:border-primary-100 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-white text-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4. Solution & Features Section */}
      <section className="py-24 overflow-hidden bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="flex flex-col lg:flex-row items-center gap-16"
          >
            <motion.div variants={fadeInUp} className="lg:w-1/2">
              <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full text-sm font-semibold mb-6">
                <ShieldPlus className="w-4 h-4" />
                <span>The SkinHealth Solution</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">
                A Safer Way to Get a Second Opinion Before the Waiting Room
              </h2>
              <p className="text-lg text-slate-700 font-medium mb-8 leading-relaxed">
                SkinHealth combines AI-assisted image screening with access to
                real, licensed dermatologists — so you can make an informed
                decision about whether and how urgently to seek care.
              </p>

              <ul className="space-y-6">
                {[
                  "AI-assisted preliminary skin screening — not a diagnosis",
                  "Instant triage priority level: Low, Moderate, High, or Critical",
                  "Plain-language explanations of what the AI observed",
                  "Book a follow-up with a licensed dermatologist securely",
                ].map((feature, i) => (
                  <motion.li
                    variants={fadeInUp}
                    key={i}
                    className="flex items-start bg-white p-4 rounded-xl shadow-sm border border-slate-100"
                  >
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mr-4 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-800 font-semibold">
                      {feature}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="lg:w-1/2 grid grid-cols-2 gap-4"
            >
              <div className="space-y-4 mt-8 lg:mt-12">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg hover:-translate-y-1 transition-transform">
                  <Activity className="w-10 h-10 text-primary-600 mb-6" />
                  <h4 className="text-xl font-extrabold text-slate-900 mb-2">
                    Available 24/7
                  </h4>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    Screen your concern any time — no appointment needed.
                  </p>
                </div>
                <div className="bg-primary-900 p-8 rounded-3xl shadow-xl hover:-translate-y-1 transition-transform">
                  <Lock className="w-10 h-10 text-primary-300 mb-6" />
                  <h4 className="text-xl font-extrabold text-white mb-2">
                    Bank-Level Security
                  </h4>
                  <p className="text-primary-100 font-medium leading-relaxed">
                    Data is end-to-end encrypted and never sold.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-emerald-900 p-8 rounded-3xl shadow-xl hover:-translate-y-1 transition-transform">
                  <CheckCircle2 className="w-10 h-10 text-emerald-300 mb-6" />
                  <h4 className="text-xl font-extrabold text-white mb-2">
                    Fast Results
                  </h4>
                  <p className="text-emerald-100 font-medium leading-relaxed">
                    Receive a preliminary assessment in under a minute.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg hover:-translate-y-1 transition-transform">
                  <Stethoscope className="w-10 h-10 text-primary-600 mb-6" />
                  <h4 className="text-xl font-extrabold text-slate-900 mb-2">
                    Real Doctors
                  </h4>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    Licensed dermatologists review all flagged cases.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section
        id="how-it-works"
        className="py-24 bg-slate-950 text-white relative overflow-hidden"
      >
        {/* Subtle Background Glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-900/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl lg:text-5xl font-extrabold mb-6 tracking-tight"
            >
              How SkinHealth Works
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-slate-300 font-medium"
            >
              From photo upload to professional consultation — five simple
              steps.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-5 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-12 right-12 h-0.5 bg-slate-800 z-0" />

            {[
              {
                num: "01",
                title: "Create a free, secure account in under a minute",
              },
              {
                num: "02",
                title:
                  "Upload a clear photo of the skin area you're concerned about",
              },
              {
                num: "03",
                title:
                  "Our AI screens the image and generates a priority level",
              },
              {
                num: "04",
                title: "Review your plain-language report and confidence score",
              },
              {
                num: "05",
                title: "Book follow-up with a licensed dermatologist if needed",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.5, ease: "easeOut" }}
                viewport={{ once: true, margin: "-100px" }}
                className="relative z-10 text-center flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-slate-900 border-4 border-slate-800 shadow-[0_0_20px_rgba(14,165,233,0.15)] flex items-center justify-center font-bold text-xl mb-6 text-primary-400">
                  {step.num}
                </div>
                <h4 className="font-semibold text-slate-200 leading-snug px-2">
                  {step.title}
                </h4>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className="mt-20 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-8 max-w-3xl mx-auto text-center shadow-2xl"
          >
            <p className="text-slate-300 font-medium leading-relaxed">
              <strong className="text-white">Important Context:</strong> The AI
              screening report is a triage tool designed to help you understand
              urgency — it is{" "}
              <span className="text-primary-400 font-bold border-b border-primary-500/50 pb-0.5">
                not a clinical diagnosis
              </span>
              . All results include a confidence indicator and are supported by
              licensed medical professionals when follow-up action is warranted.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 6. How the Doctor Review Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight"
            >
              AI Screening + Human Expertise
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-slate-600 font-medium"
            >
              We never rely on AI alone. Every case that requires professional
              review is assigned to a licensed, board-certified dermatologist —
              not a chatbot.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Activity,
                color: "bg-primary-50 text-primary-600 border-primary-100",
                title: "Step 1 — AI Triage",
                body: "Our AI model screens your uploaded image for visual characteristics associated with common skin conditions. It assigns a triage level and provides a summary of what it observed — in plain language.",
              },
              {
                icon: AlertTriangle,
                color: "bg-amber-50 text-amber-600 border-amber-100",
                title: "Step 2 — Priority Flagging",
                body: "If the AI assigns a Moderate, High, or Critical triage level, the case is automatically escalated for human review. All screening results include transparency on confidence levels so you always know how certain the AI is.",
              },
              {
                icon: Stethoscope,
                color: "bg-emerald-50 text-emerald-600 border-emerald-100",
                title: "Step 3 — Doctor Consultation",
                body: "A real licensed dermatologist reviews your case. You can communicate via secure in-app messaging or schedule a live video consultation directly on the platform — no phone tag, no waiting rooms.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border shadow-sm ${item.color}`}
                >
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {item.body}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 9. CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary-700 to-primary-900 relative overflow-hidden text-center shadow-inner">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNHYtbDItMiAyaDZWMTJoLTZsLTIgMi0yLTJINHYxaDF2MmgtMXYxSDB2MmgyLjlsMiAySDF2Mmg0LjVsLTIgMkgwdjJoOGw2LTV2LTJsLTItMnYtMmwtMi0ydjJIMXYtMmgtMXYyaDBWMTRoMTB2MTJoNHYtaDR2LTEwaDR2Mmgwdi0xTDE0IDI0aDJ2MmgtMnYtMnpNNiAyMmg3djJINnptMTAtMnYxaDh2LTFoLTh6TTggMTJoLTFoNHYyaC00djFoNnYtMmgtMXYxSDN2LTFoNXptOC0xMGgydjJoLTJ6bS00IDJoLTJ2MmgyVjA0eiIvPjwvZz48L3N2Zz4=')] opacity-10" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-4xl mx-auto px-4 relative z-10"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-tight drop-shadow-md"
          >
            Get Clarity on Your Skin Health — Today
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-primary-100 text-lg mb-10 max-w-2xl mx-auto font-medium"
          >
            Free to start. No appointment needed. A licensed dermatologist is
            ready to review your case if the AI recommends it.
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Link to="/scan">
              <Button
                size="lg"
                className="bg-white text-primary-900 hover:bg-slate-50 border-none shadow-2xl text-lg px-10 py-7 rounded-full hover:scale-105 transition-transform font-bold"
              >
                Start Free Screening
              </Button>
            </Link>
          </motion.div>
          <motion.p
            variants={fadeInUp}
            className="text-primary-300 text-sm mt-8 font-medium"
          >
            This platform provides preliminary triage assistance only — not
            medical advice or diagnosis. In an emergency, call 911 immediately.
          </motion.p>
        </motion.div>
      </section>

      {/* 10. Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
            <div className="flex items-center space-x-2">
              <ShieldPlus className="h-8 w-8 text-primary-500" />
              <span className="text-2xl font-bold tracking-tight text-white">
                SkinHealth
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-sm font-medium">
              {[
                { name: "About", path: "/about" },
                { name: "Privacy Policy", path: "/privacy" },
                { name: "Medical Disclaimer", path: "/disclaimer" },
                { name: "Contact", path: "/contact" },
                { name: "Terms of Use", path: "/terms" },
              ].map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="hover:text-primary-400 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-800 pt-10 text-xs text-center leading-relaxed max-w-5xl mx-auto opacity-70">
            <p className="mb-3 uppercase tracking-widest font-bold text-slate-500">
              Important Medical Disclaimer
            </p>
            <p className="font-medium text-slate-400">
              SkinHealth provides AI-assisted triage screening and educational
              guidance only. It does{" "}
              <strong className="text-slate-300">
                not provide medical diagnoses
              </strong>
              , prescribe treatment, or constitute clinical medical advice. The
              automated risk assessment is a preliminary support tool designed
              to help users decide whether to seek professional care — it is not
              a substitute for the judgement of a qualified healthcare
              professional. Always consult your physician or a licensed
              dermatologist for any skin-related medical concern. If you are
              experiencing a medical emergency, call 911 or go to your nearest
              emergency department immediately.
            </p>
            <p className="mt-8">
              &copy; {new Date().getFullYear()} SkinHealth Ltd. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
