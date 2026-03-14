import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  FileSearch,
  Loader2,
  MessageSquare,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/core/Button";
import { Card, CardContent } from "../../components/core/Card";
import { SecureTextChat } from "../../components/shared/SecureTextChat";
import { supabase } from "../../config/supabase";
import { cn } from "../../utils/cn";

// patient history types
interface UploadHistoryItem {
  id: string; // upload ref
  created_at: string;
  status: string; // current state
  body_part: string | null;
  analysis: {
    id: string;
    risk_level: string;
    summary?: string;
    confidence?: number;
    severity_score?: number;
  } | null;
  consultations: {
    id: string;
    status: "pending" | "scheduled" | "reviewed" | "closed";
    scheduled_at: string | null;
    doctor_notes: string | null;
    doctor: { full_name: string } | null;
  }[];
}

const RISK_COLORS: Record<string, string> = {
  CRITICAL: "text-red-700 bg-red-50 ring-red-200",
  HIGH: "text-orange-700 bg-orange-50 ring-orange-200",
  MODERATE: "text-yellow-700 bg-yellow-50 ring-yellow-200",
  LOW: "text-green-700 bg-green-50 ring-green-200",
};

export function ScanHistory() {
  const [chatConsultId, setChatConsultId] = useState<string | null>(null);
  const [callConsultId, setCallConsultId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: uploads = [], isLoading } = useQuery<UploadHistoryItem[]>({
    queryKey: ["patient-scan-history"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { data, error } = await supabase
        .from("uploads")
        .select(
          `
          id, created_at, status, body_part,
          analysis:analysis_results(id, risk_level, summary, confidence, severity_score),
          consultations(id, status, scheduled_at, doctor_notes, doctor:profiles!consultations_doctor_id_fkey(full_name))
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data as any[]).map((item) => ({
        ...item,
        analysis: Array.isArray(item.analysis)
          ? item.analysis[0]
          : item.analysis,
      })) as UploadHistoryItem[];
    },
  });

  // realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("scan-history-analysis-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "analysis_results" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["patient-scan-history"] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // match active consultation
  const getConsultation = (id: string) => {
    for (const u of uploads) {
      const c = u.consultations?.find((c) => c.id === id);
      if (c) return c;
    }
    return null;
  };

  const activeCallConsult = callConsultId
    ? getConsultation(callConsultId)
    : null;
  const activeChatConsult = chatConsultId
    ? getConsultation(chatConsultId)
    : null;

  // active call screen
  if (activeCallConsult) {
    const doctorName = activeCallConsult.doctor?.full_name
      ? `Dr. ${activeCallConsult.doctor.full_name.replace(/^Dr\.\s*/i, "")}`
      : "Your Doctor";

    // prevent patient dialing
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center text-4xl font-bold uppercase">
          {doctorName.charAt(0)}
        </div>
        <p className="text-xl font-semibold">{doctorName}</p>
        <p className="text-slate-400 text-sm">
          Waiting for doctor to start the call…
        </p>
        <p className="text-xs text-slate-500 max-w-xs text-center">
          Your doctor needs to initiate the video call from their portal. Please
          keep this screen open.
        </p>
        <button
          onClick={() => setCallConsultId(null)}
          className="mt-6 px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  // active message thread
  if (activeChatConsult) {
    const doctorName = activeChatConsult.doctor?.full_name
      ? `Dr. ${activeChatConsult.doctor.full_name.replace(/^Dr\.\s*/i, "")}`
      : "Your Doctor";

    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
        <div className="w-full max-w-3xl h-[80vh] shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <SecureTextChat
            consultationId={activeChatConsult.id}
            role="patient"
            otherPartyName={doctorName}
            onClose={() => setChatConsultId(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Scan History</h1>
        <p className="mt-1 text-sm text-slate-500">
          A complete record of all your secure skin scans and AI assessments.
        </p>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-400 border border-surface-border rounded-xl bg-white">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading your scan history...
          </div>
        ) : uploads.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-500 cursor-default">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSearch className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-900 font-medium mb-1">
                No past scans found.
              </p>
              <p className="text-sm mb-6">
                You haven't uploaded any lesions yet.
              </p>
              <Link to="/patient/upload">
                <Button variant="outline">Start your first scan</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {uploads.map((upload) => {
              const riskLevel = upload.analysis?.risk_level ?? "PENDING";
              // pick newest session
              const consult =
                upload.consultations?.length > 0
                  ? upload.consultations.reduce(
                      (latest, current) =>
                        // default to active
                        current.status === "scheduled" ||
                        current.status === "pending"
                          ? current
                          : latest,
                      upload.consultations[0],
                    )
                  : null;

              const canMessage = Boolean(consult);
              const canCall =
                Boolean(consult) &&
                consult.status === "scheduled" &&
                Boolean(consult.doctor);

              return (
                <Card
                  key={upload.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row p-0">
                    {/* dynamic risk border */}
                    <div
                      className={cn(
                        "h-1.5 md:h-auto md:w-2 shrink-0 left-0 top-0",
                        riskLevel === "CRITICAL"
                          ? "bg-red-500"
                          : riskLevel === "HIGH"
                            ? "bg-orange-500"
                            : riskLevel === "MODERATE"
                              ? "bg-yellow-500"
                              : riskLevel === "LOW"
                                ? "bg-green-500"
                                : "bg-slate-300",
                      )}
                    />

                    <div className="flex-1 p-5 lg:p-6 pb-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span
                              className={cn(
                                "text-xs px-2.5 py-0.5 rounded-full font-bold tracking-wider ring-1 uppercase",
                                RISK_COLORS[riskLevel] ??
                                  "bg-slate-100 text-slate-600 ring-slate-200",
                              )}
                            >
                              {riskLevel} RISK
                            </span>
                          </div>
                          <h3 className="font-semibold text-lg text-slate-800">
                            {upload.body_part
                              ? `Scan: ${upload.body_part}`
                              : "Skin Scan"}
                          </h3>
                          <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(upload.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>

                        {/* booking state */}
                        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                          {!consult && (
                            <span className="text-slate-400 flex items-center">
                              No Consultation
                            </span>
                          )}
                          {consult?.status === "pending" && (
                            <span className="text-amber-600 flex items-center">
                              <AlertTriangle className="h-3.5 w-3.5 mr-1" />{" "}
                              Doctor Requested
                            </span>
                          )}
                          {consult?.status === "scheduled" && (
                            <span className="text-green-600 flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1" />{" "}
                              Appointment Confirmed
                            </span>
                          )}
                          {consult?.status === "reviewed" && (
                            <span className="text-slate-500 flex items-center">
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />{" "}
                              Completed
                            </span>
                          )}
                        </div>
                      </div>

                      {upload.analysis?.summary && (
                        <div className="mt-4 mb-2 bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              AI Clinical Summary
                            </p>
                            {upload.analysis.confidence !== undefined && (
                              <span className="text-xs font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-500">
                                Conf:{" "}
                                {(upload.analysis.confidence * 100).toFixed(1)}%
                                | Sev: {upload.analysis.severity_score}/10
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {upload.analysis.summary
                              .replace(
                                /This AI screening tool is not a substitute for professional medical advice.*/,
                                "",
                              )
                              .trim()}
                          </p>
                        </div>
                      )}

                      {consult?.scheduled_at &&
                        consult.status === "scheduled" && (
                          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                            <span className="font-semibold text-green-900">
                              Next Appointment:{" "}
                            </span>
                            <span className="text-green-800">
                              {new Date(
                                consult.scheduled_at,
                              ).toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                              })}{" "}
                              at{" "}
                              {new Date(
                                consult.scheduled_at,
                              ).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )}

                      {consult?.doctor_notes && (
                        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Doctor's Notes
                          </p>
                          <p className="text-sm text-slate-700 italic">
                            "{consult.doctor_notes}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 p-5 lg:p-6 border-t md:border-t-0 md:border-l border-surface-border flex flex-col justify-center gap-3 w-full md:w-56 shrink-0">
                      {consult ? (
                        <>
                          {canCall && (
                            <Button
                              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                              onClick={() => setCallConsultId(consult.id)}
                            >
                              <Video className="h-4 w-4 mr-2" />
                              Call Doctor
                            </Button>
                          )}
                          {canMessage && (
                            <Button
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => setChatConsultId(consult.id)}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message Dr.
                            </Button>
                          )}
                        </>
                      ) : (
                        <Link to="/patient/consultation">
                          <Button className="w-full">
                            <Calendar className="h-4 w-4 mr-2" />
                            Book Consult
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
