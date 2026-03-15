import { motion } from "framer-motion";
import { Activity, CheckCircle2, Lock, ShieldPlus } from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/core/Button";
import { Input } from "../../components/core/Input";
import { supabase } from "../../config/supabase";

export function DoctorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location } | null;
  const modalLinkState = state?.backgroundLocation
    ? { backgroundLocation: state.backgroundLocation }
    : undefined;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const userRole = data.user.user_metadata?.role || "patient";
      if (userRole !== "doctor") {
        await supabase.auth.signOut();
        throw new Error(
          "This login is for medical professionals. Please use the Patient Portal.",
        );
      } else {
        navigate("/doctor");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to login";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white/95 backdrop-blur-2xl relative overflow-hidden rounded-[32px] border border-white/90 shadow-[0_30px_120px_rgba(16,185,129,0.22)] ring-2 ring-emerald-200/60">
      {/* Background Splash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 0.8 }}
        className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-100 rounded-full blur-[120px] pointer-events-none"
      />

      {/* Left side: Animated Themed Branding */}
      <div className="hidden md:flex md:w-1/2 relative p-8 lg:p-10 flex-col justify-between overflow-hidden bg-white/70 border-r border-white/60">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col h-full justify-center"
        >
          <div className="bg-emerald-50 text-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
            <ShieldPlus className="w-8 h-8" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 leading-[1.1] mb-4">
            Advanced Tools. <br />
            <span className="text-emerald-600">Clinical Focus.</span>
          </h1>
          <p className="text-base text-slate-600 max-w-lg mb-6">
            Access your encrypted clinical dashboard. Review patient scans,
            securely message cases, and manage your digitized practice with
            ease.
          </p>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-3 rounded-full shadow-sm">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Efficient Triage</h4>
                <p className="text-sm text-slate-500">
                  Pre-screened cases prioritized by urgency.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white p-3 rounded-full shadow-sm">
                <Lock className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">
                  Encrypted Communications
                </h4>
                <p className="text-sm text-slate-500">
                  Communicate securely with patients and peers.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-6 lg:p-8 relative z-20">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              Doctor Sign In
            </h3>
            <p className="text-slate-500 font-medium">
              Welcome back to your clinical dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@example.com"
              required
            />
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs font-medium text-emerald-600 hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

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

            <Button
              type="submit"
              className="w-full text-lg h-12 rounded-xl transition-all shadow-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
              isLoading={isLoading}
            >
              Sign In to Practice
            </Button>
          </form>

          <div className="text-center text-sm font-medium mt-5 text-slate-500">
            Don't have a provider account?{" "}
            <Link
              to="/doctor/register"
              state={modalLinkState}
              className="text-emerald-600 hover:underline"
            >
              Request access
            </Link>
          </div>

          <div className="text-center text-sm font-medium mt-5 pt-5 border-t border-slate-100 text-slate-500">
            Are you a patient?{" "}
            <Link
              to="/login"
              state={modalLinkState}
              className="text-primary-600 hover:underline"
            >
              Patient Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
