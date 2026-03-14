import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    if (!fullName || !licenseNumber || !specialty) {
      return setError("Please fill in all professional details");
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
    <div className="flex-1 flex flex-col md:flex-row w-full bg-white relative overflow-hidden">
      {/* Background Splash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 0.8 }}
        className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-100 rounded-full blur-[120px] pointer-events-none"
      />

      {/* Left side: Animated Themed Branding */}
      <div className="hidden md:flex md:w-1/2 relative p-12 lg:p-24 flex-col justify-between overflow-hidden">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col h-full justify-center"
        >
          <div className="bg-emerald-50 text-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.1] mb-6">
            The AI Co-Pilot for <br />
            <span className="text-emerald-600">Dermatologists.</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-lg mb-12">
            Sign up to join our secure network. Review AI-triaged patient cases,
            streamline your digital workflow, and focus your time where it's
            needed most.
          </p>

          <div className="space-y-6">
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
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-8 lg:p-12 relative z-20 border-l border-slate-100 shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              Create Provider Account
            </h3>
            <p className="text-slate-500 font-medium">
              Register for verified access to clinical tools.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
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

          <div className="text-center text-sm font-medium mt-8 text-slate-500 px-8">
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

          <div className="text-center text-sm font-medium mt-6 pt-6 border-t border-slate-100">
            <span className="text-slate-500">Already verified? </span>
            <Link
              to="/doctor/login"
              className="text-emerald-600 hover:underline"
            >
              Sign in Instead
            </Link>
          </div>

          <div className="text-center text-sm font-medium mt-4 text-slate-500">
            Are you a patient?{" "}
            <Link to="/register" className="text-primary-600 hover:underline">
              Patient Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
