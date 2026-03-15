import { Bell, Loader2, Mail, Shield, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../components/core/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/core/Card";
import { supabase } from "../../config/supabase";

export function DoctorSettings() {
  const [profile, setProfile] = useState<{
    full_name: string;
    license_number: string;
    email: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Try getting from metadata first (as set in DoctorRegister)
        const metadata = user.user_metadata;

        // Also check profiles table for most up-to-date info
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, license_number")
          .eq("id", user.id)
          .maybeSingle();

        setProfile({
          full_name: profileData?.full_name || metadata?.full_name || "Doctor",
          license_number:
            profileData?.license_number ||
            metadata?.license_number ||
            "Not Verified",
          email: user.email || "",
        });
      } catch (err) {
        console.error("Error loading doctor profile:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleRequestUpdate = () => {
    const subject = encodeURIComponent(
      "Profile Update Request: " + (profile?.full_name || "Doctor"),
    );
    const body = encodeURIComponent(
      "Hello Support,\n\nI would like to request an update to my professional profile.\n\nCurrent Name: " +
        profile?.full_name +
        "\nLicense: " +
        profile?.license_number +
        "\n\nProposed Changes:\n[Enter changes here]",
    );
    window.location.href = `mailto:support@dermify.ai?subject=${subject}&body=${body}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-surface-muted">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in p-8 bg-surface-muted min-h-[calc(100vh-64px)]">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Clinical Settings
        </h1>
        <p className="text-slate-500 mt-1">
          Manage your professional profile, notification preferences, and
          security.
        </p>
      </div>

      <div className="space-y-6">
        <Card className="rounded-[32px] border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
            <CardTitle className="text-slate-800 flex items-center text-lg font-bold">
              <User className="mr-3 h-5 w-5 text-primary-600" />
              Professional Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                    Full Provider Name
                  </label>
                  <div className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-slate-900 font-bold block">
                    {profile?.full_name}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                    Registered Email
                  </label>
                  <div className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-slate-600 font-medium block italic">
                    {profile?.email}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                    Medical License Number
                  </label>
                  <div className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-slate-900 font-bold block">
                    {profile?.license_number}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-50 flex justify-end">
              <Button
                variant="outline"
                className="rounded-xl border-slate-200 hover:border-primary-500 hover:bg-primary-50 transition-all font-bold px-6"
                onClick={handleRequestUpdate}
              >
                <Mail className="w-4 h-4 mr-2" />
                Request Profile Update
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
            <CardTitle className="text-slate-800 flex items-center text-lg font-bold">
              <Bell className="mr-3 h-5 w-5 text-primary-600" />
              Notification Routing
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all">
                <div>
                  <h4 className="font-bold text-slate-900">
                    High Risk Priority Alerts
                  </h4>
                  <p className="text-sm text-slate-500 max-w-sm">
                    Immediate SMS and Email for &gt;85% AI confidence cases.
                    This ensures critical patients are prioritized.
                  </p>
                </div>
                <div className="w-14 h-8 bg-primary-600 rounded-full flex items-center p-1 justify-end cursor-not-allowed shadow-inner transition-opacity opacity-80">
                  <div className="w-6 h-6 bg-white rounded-full shadow-md"></div>
                </div>
              </div>

              <div className="h-px bg-slate-50 w-full" />

              <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all">
                <div>
                  <h4 className="font-bold text-slate-900">
                    Standard Queue Updates
                  </h4>
                  <p className="text-sm text-slate-500 max-w-sm">
                    Daily digest of new moderate and low risk triages to keep
                    your workflow organized.
                  </p>
                </div>
                <div className="w-14 h-8 bg-slate-200 rounded-full flex items-center p-1 justify-start cursor-not-allowed shadow-inner transition-opacity opacity-80">
                  <div className="w-6 h-6 bg-white rounded-full shadow-md"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
            <CardTitle className="text-slate-800 flex items-center text-lg font-bold">
              <Shield className="mr-3 h-5 w-5 text-status-safe" />
              Security & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <Shield className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">
                    Two-Factor Authentication
                  </h4>
                  <p className="text-sm text-emerald-700/70">
                    Verified and active. Required by HIPAA compliance policy.
                  </p>
                </div>
              </div>
              <span className="bg-white text-emerald-600 px-6 py-2 rounded-xl text-xs font-extrabold uppercase tracking-widest shadow-sm border border-emerald-100">
                ACTIVE
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
