import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Loader2,
  MessageSquare,
  UploadCloud,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/core/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/core/Card";
import { SecureTextChat } from "../../components/shared/SecureTextChat";
import { supabase } from "../../config/supabase";
import { api } from "../../services/api";
import { cn } from "../../utils/cn";

export function ConsultationBooking() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [bookedConsultId, setBookedConsultId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // latest active upload
  const { data: latestUpload } = useQuery({
    queryKey: ["latest-upload"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      // allow active states
      const { data: uploads } = await supabase
        .from("uploads")
        .select("id, status")
        .eq("user_id", user.id)
        .in("status", ["uploaded", "processing", "complete"])
        .order("created_at", { ascending: false })
        .limit(1);

      if (!uploads?.length) return null;

      // optional ai result
      const { data: analysis } = await supabase
        .from("analysis_results")
        .select("id, risk_level, confidence, summary, status")
        .eq("upload_id", uploads[0].id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return { uploadId: uploads[0].id, analysis };
    },
  });

  // fetch available doctors via backend
  const { data: doctorsList } = useQuery({
    queryKey: ["doctors-list"],
    queryFn: () => api.public.getDoctors(),
  });

  // week picker window
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });

  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
  ];

  const formatTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !selectedDoctorId) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error: insertErr } = await supabase
        .from("consultations")
        .insert({
          patient_id: user.id,
          doctor_id: selectedDoctorId,
          analysis_id: latestUpload?.analysis?.id ?? null,
          status: "pending",
          urgency:
            latestUpload?.analysis?.risk_level === "HIGH"
              ? "HIGH"
              : latestUpload?.analysis?.risk_level === "CRITICAL"
                ? "CRITICAL"
                : "ROUTINE",
          patient_notes: notes || null,
          preferred_date: new Date(
            `${selectedDate}T${selectedTime}:00`,
          ).toISOString(),
        })
        .select("id")
        .single();

      if (insertErr) throw new Error(insertErr.message);
      setBookedConsultId(data?.id ?? null);
      setIsBooked(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to book consultation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isBooked) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Card className="text-center border-primary-100 shadow-2xl rounded-[32px] overflow-hidden fade-in">
          <CardContent className="pt-12 pb-12 px-8">
            <div className="flex justify-center mb-8">
              <div className="bg-emerald-50 p-4 rounded-full">
                <CheckCircle2 className="h-16 w-16 text-emerald-500" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
              Consultation Requested
            </h2>
            <p className="text-slate-600 text-lg mb-4">
              Your request has been sent to our dermatology team.
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-10 inline-block w-full max-w-md">
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">
                Requested Appointment
              </p>
              <p className="text-slate-900 font-bold text-lg">
                {selectedDate &&
                  new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
              </p>
              <p className="text-primary-600 font-bold text-xl mt-1">
                at {selectedTime && formatTime(selectedTime)}
              </strong>
              <br />A doctor will confirm or adjust the time based on
              availability.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/patient">
                <Button variant="outline">Return to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        {isChatOpen && bookedConsultId && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
            <div className="w-full max-w-3xl h-[80vh] shadow-2xl rounded-[32px] overflow-hidden animate-in zoom-in-95 duration-200">
              <SecureTextChat
                consultationId={bookedConsultId}
                role="patient"
                otherPartyName="Your Doctor"
                onClose={() => setIsChatOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 fade-in py-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Schedule Your Visit
          </h1>
          <p className="mt-2 text-lg text-slate-500 max-w-2xl">
            Choose your preferred time for a clinical review. Our dermatologists
            provide expert guidance for your skin health concerns.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Alerts and Notes */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-4">
            {/* Linked analysis — shown if analysis exists */}
            {latestUpload?.analysis &&
              latestUpload.analysis.status !== "failed" && (
                <div className="flex items-center gap-4 bg-primary-50 border border-primary-100 rounded-3xl p-6 shadow-sm">
                  <div className="bg-primary-100 p-2.5 rounded-2xl">
                    <AlertTriangle className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Linked Analysis
                    </p>
                    <p className="text-sm text-slate-600">
                      Risk:{" "}
                      <span className="text-primary-700 font-bold">
                        {latestUpload.analysis.risk_level}
                      </span>{" "}
                      (
                      {((latestUpload.analysis.confidence ?? 0) * 100).toFixed(
                        0,
                      )}
                      % confidence)
                    </p>
                  </div>
                </div>
              )}

            {latestUpload?.analysis?.status === "failed" && (
              <div className="flex items-start gap-4 bg-amber-50 border border-amber-100 rounded-3xl p-6 shadow-sm">
                <div className="bg-amber-100 p-2.5 rounded-2xl mt-0.5">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Analysis Pending Review
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    AI analysis failed, but our clinical team will review your
                    case directly.
                  </p>
                </div>
              </div>
            )}

            {/* No upload yet — must upload first */}
            {!latestUpload && (
              <div className="flex items-start gap-4 bg-amber-50 border border-amber-100 rounded-3xl p-6 shadow-sm">
                <div className="bg-amber-100 p-2.5 rounded-2xl mt-0.5">
                  <UploadCloud className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    No Image Uploaded
                  </p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    You can still book, but uploading an image helps our
                    dermatologists prepare for your case.
                  </p>
                  <Link
                    to="/patient/upload"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors"
                  >
                    Go to Upload <span className="text-sm">→</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Card className="rounded-[32px] border-slate-100 shadow-xl shadow-slate-200/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">
                Consultation Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                maxLength={500}
                placeholder="Describe your concern, how long you've noticed it, or any other details..."
                className="w-full border-2 border-slate-50 bg-slate-50/50 rounded-2xl p-4 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
              />
              <p className="text-[10px] font-bold text-slate-400 mt-2 text-right uppercase tracking-wider">
                {notes.length} / 500 characters
              </p>
            </CardContent>
          </Card>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Doctor Selection */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Users className="w-5 h-5 mr-3 text-primary-600" />
              Select Dermatologist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full border border-surface-border rounded-lg p-3 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
              required
            >
              <option value="" disabled>Choose a doctor...</option>
              {doctorsList?.map(doc => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.full_name} {doc.parish ? `- Office located in ${doc.parish}` : ''}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* calendar input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Calendar className="w-5 h-5 mr-3 text-primary-600" />
              Preferred Date
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dates.map((d) => {
              const iso = d.toISOString().split("T")[0];
              return (
                <button
                  key={iso}
                  onClick={() => setSelectedDate(iso)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer text-sm",
                    selectedDate === iso
                      ? "bg-primary-50 border-primary-500 text-primary-700 font-medium"
                      : "border-surface-border text-slate-700 hover:bg-slate-50",
                  )}
                >
                  <span>
                    {d.toLocaleDateString("en-US", { weekday: "long" })}
                  </span>
                  <span className="opacity-70">
                    {d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

              {/* Time Slots Section */}
              <div
                className={cn(
                  "p-8 transition-all duration-300",
                  !selectedDate
                    ? "bg-slate-50/50 opacity-40 pointer-events-none grayscale"
                    : "bg-white",
                )}
              >
                <h3 className="flex items-center text-lg font-bold text-slate-900 mb-6">
                  <div className="bg-primary-50 p-2 rounded-xl mr-3">
                    <MessageSquare className="w-5 h-5 text-primary-600" />
                  </div>
                  Available Times
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {timeSlots.map((t) => {
                    const isSelected = selectedTime === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setSelectedTime(t)}
                        className={cn(
                          "py-4 px-2 rounded-2xl border-2 text-sm font-bold transition-all duration-200 text-center",
                          isSelected
                            ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200 ring-4 ring-primary-50"
                            : "bg-white border-slate-50 text-slate-600 hover:border-primary-100 hover:bg-primary-50/30",
                        )}
                      >
                        {formatTime(t)}
                      </button>
                    );
                  })}
                </div>

                {selectedDate && selectedTime && (
                  <div className="mt-10 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 text-center">
                      Summary
                    </p>
                    <p className="text-sm font-bold text-slate-900 text-center">
                      Booking for{" "}
                      {new Date(selectedDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      at {formatTime(selectedTime)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

      <div className="flex justify-end pt-2">
        <Button
          size="lg"
          disabled={
            !selectedDate ||
            !selectedTime ||
            !selectedDoctorId ||
            isSubmitting
          }
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting…
            </>
          ) : (
            "Request Consultation"
          )}
        </Button>
      </div>
    </div>
  );
}
