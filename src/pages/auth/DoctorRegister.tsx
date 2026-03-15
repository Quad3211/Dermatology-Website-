import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "../../config/supabase";
import { Button } from "../../components/core/Button";
import { Input } from "../../components/core/Input";
import { ShieldPlus, Activity, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function DoctorRegister() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [parish, setParish] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const JAMAICA_PARISHES = [
    "Clarendon", "Hanover", "Kingston", "Manchester", "Portland",
    "St. Andrew", "St. Ann", "St. Catherine", "St. Elizabeth",
    "St. James", "St. Mary", "St. Thomas", "Trelawny", "Westmoreland"
  ];
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const modalLinkState = (location.state as any)?.backgroundLocation
    ? { backgroundLocation: (location.state as any).backgroundLocation }
    : undefined;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    if (!fullName || !licenseNumber || !specialty || !officeAddress || !parish) {
      return setError("Please fill in all professional details and address");
    }

    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: "doctor",
            full_name: fullName,
            license_number: licenseNumber,
            specialty,
            office_address: officeAddress,
            parish,
          },
        },
      });

      if (error) throw error;

      navigate("/doctor");
    } catch (err: any) {
      setError(err.message || "Failed to register");
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
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 leading-[1.1] mb-4">
            The AI Co-Pilot for <br />
            <span className="text-emerald-600">Dermatologists.</span>
          </h1>
          <p className="text-base text-slate-600 max-w-lg mb-6">
            Sign up to join our secure network. Review AI-triaged patient cases,
            streamline your digital workflow, and focus your time where it's
            needed most.
          </p>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-3 rounded-full shadow-sm">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Reduce Backlogs</h4>
                <p className="text-sm text-slate-500">
                  Let AI pre-sort benign vs suspect cases for you.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white p-3 rounded-full shadow-sm">
                <ShieldPlus className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Second Opinions</h4>
                <p className="text-sm text-slate-500">
                  Collaborate securely with peers on complex diagnoses.
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
              Create Provider Account
            </h3>
            <p className="text-slate-500 font-medium">
              Register for verified access to clinical tools.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Dr. Jane Doe"
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@example.com"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Medical License #"
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="MD-123456"
                required
              />
              <Input
                label="Specialty"
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Dermatology"
                required
              />
            </div>
            
            <Input
              label="Office Address"
              type="text"
              value={officeAddress}
              onChange={(e) => setOfficeAddress(e.target.value)}
              placeholder="123 Health Ave, Suite 4"
              required
            />
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Parish
              </label>
              <select
                value={parish}
                onChange={(e) => setParish(e.target.value)}
                required
                className="w-full h-11 px-4 text-base bg-slate-50 border border-slate-200 rounded-xl transition-all outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-slate-300 text-slate-900"
              >
                <option value="" disabled>Select Parish</option>
                {JAMAICA_PARISHES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
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

            <Button
              type="submit"
              className="w-full text-lg h-12 rounded-xl transition-all shadow-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
              isLoading={isLoading}
            >
              Sign Up as Doctor
            </Button>
          </form>

          <div className="text-center text-sm font-medium mt-5 text-slate-500 px-4">
            By creating an account, you agree to our{" "}
            <Link to="/terms" className="underline hover:text-slate-800">
              Provider Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline hover:text-slate-800">
              HIPAA Agreement
            </Link>
            .
          </div>

          <div className="text-center text-sm font-medium mt-5 pt-5 border-t border-slate-100">
            <span className="text-slate-500">Already verified? </span>
            <Link
              to="/doctor/login"
              state={modalLinkState}
              className="text-emerald-600 hover:underline"
            >
              Sign in Instead
            </Link>
          </div>

          <div className="text-center text-sm font-medium mt-3 text-slate-500">
            Are you a patient?{" "}
            <Link
              to="/register"
              state={modalLinkState}
              className="text-primary-600 hover:underline"
            >
              Patient Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
