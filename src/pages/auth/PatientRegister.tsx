import { motion } from "framer-motion";
import { Activity, Lock, Scan, ShieldPlus } from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/core/Button";
import { Input } from "../../components/core/Input";
import { supabase } from "../../config/supabase";

export function PatientRegister() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dpaConsent, setDpaConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location } | null;
  const modalLinkState = state?.backgroundLocation
    ? { backgroundLocation: state.backgroundLocation }
    : undefined;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dpaConsent) {
      return setError("You must consent to the DPA privacy terms to register.");
    }
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: "patient",
          },
        },
      });

      if (error) throw error;

      // Navigate to patient dashboard on success
      navigate("/patient");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white/95 backdrop-blur-2xl relative overflow-hidden rounded-[32px] border border-white/90 shadow-[0_30px_120px_rgba(14,116,144,0.25)] ring-2 ring-primary-200/60">
      {/* Background Splash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 0.8 }}
        className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-100 rounded-full blur-[120px] pointer-events-none"
      />

      {/* Left side: Animated Themed Branding */}
      <div className="hidden md:flex md:w-1/2 relative p-8 lg:p-10 flex-col justify-between overflow-hidden bg-white/70 border-r border-white/60">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col h-full justify-center"
        >
          <div className="bg-primary-50 text-primary-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
            <ShieldPlus className="w-8 h-8" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 leading-[1.1] mb-4">
            Understand Your Skin. <br />
            <span className="text-primary-600">Know Your Risk.</span>
          </h1>
          <p className="text-base text-slate-600 max-w-lg mb-6">
            Join thousands of patients taking back control of their
            dermatological health. Get instantaneous AI pre-screening and
            expedited clinical reviews from leading specialists.
          </p>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-3 rounded-full shadow-sm">
                <Scan className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Upload a Photo</h4>
                <p className="text-sm text-slate-500">
                  Take a picture of the lesion and upload it securely.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white p-3 rounded-full shadow-sm">
                <Lock className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">
                  Get Instant Results
                </h4>
                <p className="text-sm text-slate-500">
                  Our clinical AI provides an immediate risk assessment.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right side: Register Form */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-6 lg:p-8 relative z-20">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              Create Patient Account
            </h3>
            <p className="text-slate-500 font-medium">
              Register for fully secure access to the platform.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 text-sm text-status-danger bg-red-50 rounded-lg border border-red-200 flex items-center"
              >
                <Activity className="w-4 h-4 mr-2" />
                {error}
              </motion.div>
            )}

            <div className="flex items-start bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm mt-4 mb-4">
              <div className="flex items-center h-5 mt-1">
                <input
                  id="dpa-consent"
                  type="checkbox"
                  checked={dpaConsent}
                  onChange={(e) => setDpaConsent(e.target.checked)}
                  className="w-5 h-5 border border-slate-300 rounded bg-white focus:ring-3 focus:ring-primary-300 text-primary-600 appearance-none checked:bg-primary-600 checked:border-transparent transition-colors cursor-pointer relative"
                  required
                />
              </div>
              <label htmlFor="dpa-consent" className="ml-3 text-xs text-slate-600 font-medium leading-relaxed cursor-pointer">
                I explicitly consent to the collection and processing of my sensitive personal health data as required by the <strong className="text-slate-800">Jamaica Data Protection Act (DPA)</strong>. I understand this data is used solely for triage screening and dermatological consultation.
              </label>
            </div>

            <Button
              type="submit"
              className="w-full text-lg h-12 rounded-xl transition-all shadow-lg font-bold bg-primary-600 hover:bg-primary-700 shadow-primary-600/20"
              isLoading={isLoading}
            >
              Create Account
            </Button>
          </form>

          <div className="text-center text-sm font-medium mt-5 text-slate-500 px-4">
            By creating an account, you agree to our{" "}
            <Link to="/terms" className="underline hover:text-slate-800">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline hover:text-slate-800">
              Privacy Policy
            </Link>
            .
          </div>

          <div className="text-center text-sm font-medium mt-5 pt-5 border-t border-slate-100">
            <span className="text-slate-500">Already have an account? </span>
            <Link
              to="/login"
              state={modalLinkState}
              className="text-primary-600 hover:underline"
            >
              Sign In Instead
            </Link>
          </div>

          <div className="text-center text-sm font-medium mt-3 text-slate-500">
            Are you a medical professional?{" "}
            <Link
              to="/doctor/register"
              state={modalLinkState}
              className="text-emerald-600 hover:underline"
            >
              Doctor Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
