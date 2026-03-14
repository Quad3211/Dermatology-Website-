import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Loader2,
  MessageSquare,
  UploadCloud,
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
import { cn } from "../../utils/cn";

export function ConsultationBooking() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
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
    if (!selectedDate || !selectedTime) return;
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
      <>
        <Card className="max-w-xl mx-auto text-center border-primary-200 fade-in">
          <CardContent className="pt-10 pb-10">
            <div className="flex justify-center mb-6">
              <CheckCircle2 className="h-16 w-16 text-status-safe" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Consultation Requested
            </h2>
            <p className="text-slate-600 mb-2">
              Your request has been sent to our dermatology team.
            </p>
            <p className="text-slate-500 text-sm mb-8">
              You requested:{" "}
              <strong>
                {selectedDate &&
                  new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                at {selectedTime && formatTime(selectedTime)}
              </strong>
              <br />A doctor will confirm or adjust the time based on
              availability.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {bookedConsultId && (
                <Button onClick={() => setIsChatOpen(true)}>
                  Open Messages
                </Button>
              )}
              <Link to="/patient">
                <Button variant="outline">Return to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        {isChatOpen && bookedConsultId && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
            <div className="w-full max-w-3xl h-[80vh] shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <SecureTextChat
                consultationId={bookedConsultId}
                role="patient"
                otherPartyName="Your Doctor"
                onClose={() => setIsChatOpen(false)}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Request a Consultation
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Select your preferred date and time. A dermatologist will confirm your
          appointment.
        </p>
      </div>

      {/* Linked analysis — shown if analysis exists */}
      {latestUpload?.analysis && latestUpload.analysis.status !== "failed" && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0" />
          <p className="text-sm text-blue-800">
            This consultation will be linked to your most recent analysis —{" "}
            <strong>Risk: {latestUpload.analysis.risk_level}</strong> (
            {((latestUpload.analysis.confidence ?? 0) * 100).toFixed(0)}%
            confidence)
          </p>
        </div>
      )}

      {latestUpload?.analysis?.status === "failed" && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              AI analysis failed, but you can still request a consultation.
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Our clinical team can review your upload directly.
            </p>
          </div>
        </div>
      )}

      {/* No upload yet — must upload first */}
      {!latestUpload && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              No uploaded image found.
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              You can still request a consultation, but uploading helps your
              doctor review your case faster.
            </p>
            <Link
              to="/patient/upload"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 underline"
            >
              <UploadCloud className="h-3.5 w-3.5" /> Go to Upload
            </Link>
          </div>
        </div>
      )}

      {/* processing banner */}
      {latestUpload && !latestUpload.analysis && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              AI Analysis Still Processing
            </p>
            <p className="text-xs text-blue-700 mt-0.5">
              Your uploaded image is being analysed. You can still request a
              consultation now if you want.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

        {/* clock input */}
        <Card
          className={cn(
            "transition-opacity",
            !selectedDate && "opacity-50 pointer-events-none",
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <MessageSquare className="w-5 h-5 mr-3 text-primary-600" />
              Preferred Time
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2">
            {timeSlots.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTime(t)}
                className={cn(
                  "p-2.5 rounded-lg border text-xs text-center transition-colors font-medium cursor-pointer",
                  selectedTime === t
                    ? "bg-primary-50 border-primary-500 text-primary-700"
                    : "border-surface-border text-slate-700 hover:bg-slate-50",
                )}
              >
                {formatTime(t)}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* free text area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Additional Notes (optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Describe your concern, how long you've noticed it, or any other details..."
            className="w-full border border-surface-border rounded-lg p-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
          <p className="text-xs text-slate-400 mt-1 text-right">
            {notes.length}/500
          </p>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-status-danger text-center">{error}</p>
      )}

      <div className="flex justify-end pt-2">
        <Button
          size="lg"
          disabled={
            !selectedDate ||
            !selectedTime ||
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



