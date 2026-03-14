import { PublicNavbar } from "../../components/shared/PublicNavbar";
import { ShieldPlus, Award, UserCheck, Heart, Globe, Lock } from "lucide-react";
import { Link } from "react-router-dom";

export function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-20">
      <PublicNavbar />
      <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 w-full">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-primary-100 p-4 rounded-2xl shadow-sm border border-primary-200">
              <ShieldPlus className="w-12 h-12 text-primary-600" />
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            About SkinHealth
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed font-medium">
            We are building technology that makes it faster and less stressful
            for people to understand when their skin needs professional
            attention — without replacing the doctors who provide that care.
          </p>
        </div>

        {/* Mission statement */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12 shadow-sm mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-4">
            Our Mission
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Dermatology is one of the most under-resourced specialties in
            healthcare. Average appointment wait times can exceed 30 days —
            during which patients are left unsure whether their concern is
            routine or urgent. That uncertainty is stressful, and in some cases,
            it leads people to either panic unnecessarily or delay care they
            needed sooner.
          </p>
          <p className="text-slate-700 leading-relaxed">
            SkinHealth bridges that gap. Using rigorous AI-assisted screening,
            we help patients understand the likely priority level of their
            concern so they can make an informed decision about next steps — and
            connect with a real, licensed dermatologist when follow-up care is
            recommended. We want to be the first call people make, not the last
            resort.
          </p>
        </div>

        {/* Values grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
            <div className="flex justify-center mb-4">
              <Award className="w-8 h-8 text-primary-500" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Clinical Rigour
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Our AI models are developed with input from board-certified
              dermatologists. Every screening report includes a transparency
              score so you always know how much weight to place on the result.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
            <div className="flex justify-center mb-4">
              <UserCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Patients Come First
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              We designed every part of this platform around reducing anxiety
              and increasing clarity. No medical jargon, no unnecessary
              friction, and no rushing patients into decisions they don't
              understand.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
            <div className="flex justify-center mb-4">
              <Heart className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Equitable Access
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Access to quick dermatology input should not depend on your
              geography or income. SkinHealth is free to use for screening, with
              the goal of helping people in under-served communities get faster
              answers.
            </p>
          </div>
        </div>

        {/* What we are not */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 mb-12">
          <h2 className="text-xl font-extrabold text-amber-900 mb-3 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            What SkinHealth Is — and Is Not
          </h2>
          <ul className="space-y-2 text-amber-800 text-sm leading-relaxed">
            <li>
              <span className="font-bold">✓ It IS</span> an AI-assisted
              preliminary triage tool that helps assess the urgency of a skin
              concern.
            </li>
            <li>
              <span className="font-bold">✓ It IS</span> a platform to connect
              with real, licensed dermatologists for follow-up consultations.
            </li>
            <li>
              <span className="font-bold">✗ It is NOT</span> a replacement for a
              clinical diagnosis by a qualified healthcare provider.
            </li>
            <li>
              <span className="font-bold">✗ It is NOT</span> a source of medical
              treatment recommendations or prescriptions.
            </li>
            <li>
              <span className="font-bold">✗ It is NOT</span> intended to be used
              as a substitute for emergency medical services.
            </li>
          </ul>
        </div>

        {/* Global reach note */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex items-start gap-6">
          <Globe className="w-8 h-8 text-primary-500 shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Built to Scale Responsibly
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Our infrastructure is built for global healthcare standards —
              HIPAA-compliant in the United States and designed with GDPR
              principles for international users. We continuously improve our AI
              models under the oversight of medical advisors to ensure the
              platform remains accurate, safe, and beneficial as we grow.
            </p>
          </div>
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200">
        <Link to="/" className="hover:text-primary-500 transition-colors">
          ← Back to SkinHealth
        </Link>
      </footer>
    </div>
  );
}
