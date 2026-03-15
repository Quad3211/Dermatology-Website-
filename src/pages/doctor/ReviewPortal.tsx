import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Loader2,
  MessageSquare,
  User,
  Video,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/core/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/core/Card";
import { SecureTextChat } from "../../components/shared/SecureTextChat";
import { VideoCallRoom } from "../../components/shared/VideoCallRoom";
import { supabase } from "../../config/supabase";
import { cn } from "../../utils/cn";

// doctor review types
interface Consultation {
  id: string;
  status: string;
  urgency: string;
  doctor_id: string | null;
  patient_notes: string | null;
  preferred_date: string | null;
  scheduled_at: string | null;
  doctor_notes: string | null;
  created_at: string;
  patient: { id: string; full_name: string } | null;
  doctor: { full_name: string } | null;
  analysis: {
    id: string;
    risk_level: string;
    confidence: number;
    severity_score: number;
    summary: string | null;
    referral_required: boolean;
    emergency_flag: boolean;
  } | null;
}

// formatting utils
const RISK_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 ring-red-200",
  HIGH: "bg-orange-100 text-orange-700 ring-orange-200",
  MODERATE: "bg-yellow-100 text-yellow-700 ring-yellow-200",
  LOW: "bg-green-100 text-green-700 ring-green-200",
};

const URGENCY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  SOON: 2,
  ROUTINE: 3,
};

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// root view
export function ReviewPortal() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Consultation | null>(null);
  const [chatConsult, setChatConsult] = useState<Consultation | null>(null);
  const [callConsult, setCallConsult] = useState<Consultation | null>(null);

  // sched logic
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("09:00");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [activeTab, setActiveTab] = useState<
    "pending" | "scheduled" | "reviewed"
  >("pending");

  const { data: consultations = [], isLoading } = useQuery<Consultation[]>({
    queryKey: ["doctor-consultations"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("consultations")
        .select(
          `
          id, status, urgency, patient_notes, preferred_date,
          scheduled_at, doctor_notes, doctor_id, created_at,
          patient:profiles!consultations_patient_id_fkey(id, full_name),
          doctor:profiles!consultations_doctor_id_fkey(full_name),
          analysis:analysis_results(
            id, risk_level, confidence, severity_score,
            summary, referral_required, emergency_flag
          )
        `,
        )
        .or(`doctor_id.is.null,doctor_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as Consultation[];
    },
    refetchInterval: 30_000,
  });

  // self assign logic
  const claimMutation = useMutation({
    mutationFn: async (consultationId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("consultations")
        .update({ doctor_id: user.id })
        .eq("id", consultationId);
      if (error) throw error;
    },
    onSuccess: (_data, consultationId) => {
      queryClient.invalidateQueries({ queryKey: ["doctor-consultations"] });
      // sync active view
      if (selected?.id === consultationId) {
        setSelected(null);
      }
    },
  });

  // save new appointment
  const scheduleMutation = useMutation({
    mutationFn: async ({
      id,
      scheduledAt,
      notes,
    }: {
      id: string;
      scheduledAt: string;
      notes: string;
    }) => {
      const { error } = await supabase
        .from("consultations")
        .update({
          status: "scheduled",
          scheduled_at: scheduledAt,
          doctor_notes: notes || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-consultations"] });
      setSelected(null);
      setSchedDate("");
      setSchedTime("09:00");
      setDoctorNotes("");
    },
  });

  // mark complete
  const reviewMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("consultations")
        .update({
          status: "reviewed",
          doctor_notes: notes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-consultations"] });
      setSelected(null);
      setDoctorNotes("");
    },
  });

  // active tab items
  const filtered = consultations
    .filter((c) =>
      activeTab === "pending"
        ? c.status === "pending"
        : activeTab === "scheduled"
          ? c.status === "scheduled"
          : ["reviewed", "closed"].includes(c.status),
    )
    .sort(
      (a, b) =>
        (URGENCY_ORDER[a.urgency] ?? 9) - (URGENCY_ORDER[b.urgency] ?? 9),
    );

  const counts = {
    pending: consultations.filter((c) => c.status === "pending").length,
    scheduled: consultations.filter((c) => c.status === "scheduled").length,
    reviewed: consultations.filter((c) =>
      ["reviewed", "closed"].includes(c.status),
    ).length,
  };

  // video modal
  if (callConsult) {
    const patientName = callConsult.patient?.full_name ?? "Patient";
    return (
      <VideoCallRoom
        consultationId={callConsult.id}
        role="doctor"
        otherPartyName={patientName}
        onClose={() => setCallConsult(null)}
        autoStart={true}
      />
    );
  }

  // message modal
  if (chatConsult) {
    const patientName = chatConsult.patient?.full_name ?? "Patient";
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
        <div className="w-full max-w-3xl h-[80vh] shadow-2xl rounded-2xl overflow-hidden">
          <SecureTextChat
            consultationId={chatConsult.id}
            role="doctor"
            otherPartyName={patientName}
            onClose={() => setChatConsult(null)}
          />
        </div>
      </div>
    );
  }

  // right booking pane
  if (selected) {
    const analysis = selected.analysis;
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1);

    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6 fade-in">
        {/* top controls */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Schedule Appointment
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Patient:{" "}
              <span className="font-medium text-slate-700">
                {selected.patient?.full_name ?? "Unknown"}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!selected.doctor_id && (
              <button
                onClick={() => claimMutation.mutate(selected.id)}
                disabled={claimMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-60"
              >
                {claimMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
                Claim Case
              </button>
            )}
            {selected.doctor_id && selected.doctor && (
              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg font-medium">
                Assigned to Dr.{" "}
                {selected.doctor.full_name.replace(/^Dr\.\s*/i, "")}
              </span>
            )}
            {selected.doctor_id && (
              <button
                onClick={() => setCallConsult(selected)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 transition-colors"
              >
                <Video className="h-3.5 w-3.5" />
                Call Patient
              </button>
            )}
            {selected.doctor_id && (
              <button
                onClick={() => setChatConsult(selected)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Message Patient
              </button>
            )}
          </div>
          <button
            onClick={() => setSelected(null)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ai report details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-slate-500">
                AI Triage Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis ? (
                <>
                  <div
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg ring-1",
                      RISK_COLORS[analysis.risk_level] ?? "bg-slate-100",
                    )}
                  >
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-bold">{analysis.risk_level} RISK</p>
                      <p className="text-xs opacity-80">
                        Confidence:{" "}
                        {((analysis.confidence ?? 0) * 100).toFixed(0)}% ·
                        Severity: {analysis.severity_score?.toFixed(1) ?? "—"}
                        /10
                      </p>
                    </div>
                  </div>

                  {analysis.summary && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        AI Summary
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {analysis.summary}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 text-xs">
                    {analysis.referral_required && (
                      <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                        Referral Required
                      </span>
                    )}
                    {analysis.emergency_flag && (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium animate-pulse">
                        🚨 Emergency
                      </span>
                    )}
                  </div>

                  {selected.patient_notes && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Patient Notes
                      </p>
                      <p className="text-sm text-slate-700 italic">
                        "{selected.patient_notes}"
                      </p>
                    </div>
                  )}

                  {selected.preferred_date && (
                    <div className="text-xs text-slate-500">
                      Patient's preferred date:{" "}
                      <strong>
                        {new Date(selected.preferred_date).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </strong>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-400">
                  No analysis data available.
                </p>
              )}
            </CardContent>
          </Card>

          {/* conditional state panel */}
          {["reviewed", "closed"].includes(selected.status) ? (
            /* read only completed case */
            <Card className="border-t-4 border-t-slate-300">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-slate-400" />
                  Case Closed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selected.scheduled_at && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
                      Appointment Was
                    </p>
                    <p className="font-semibold text-slate-800">
                      {new Date(selected.scheduled_at).toLocaleDateString(
                        "en-US",
                        { weekday: "long", month: "long", day: "numeric" },
                      )}
                      {" at "}
                      {new Date(selected.scheduled_at).toLocaleTimeString(
                        "en-US",
                        { hour: "numeric", minute: "2-digit" },
                      )}
                    </p>
                  </div>
                )}
                {selected.doctor_notes && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Doctor Notes
                    </p>
                    <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-200">
                      {selected.doctor_notes}
                    </p>
                  </div>
                )}
                <p className="text-xs text-slate-400 text-center pt-2">
                  This consultation has been completed and is read-only.
                </p>
              </CardContent>
            </Card>
          ) : selected.status === "scheduled" ? (
            /* confirmed meeting details */
            <Card className="border-t-4 border-t-green-400">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Appointment Confirmed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selected.scheduled_at && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-xs text-green-600 font-semibold uppercase tracking-wider mb-1">
                      Scheduled For
                    </p>
                    <p className="text-xl font-bold text-green-900">
                      {new Date(selected.scheduled_at).toLocaleDateString(
                        "en-US",
                        { weekday: "long", month: "long", day: "numeric" },
                      )}
                    </p>
                    <p className="text-lg text-green-800 mt-0.5">
                      {new Date(selected.scheduled_at).toLocaleTimeString(
                        "en-US",
                        { hour: "numeric", minute: "2-digit" },
                      )}
                    </p>
                  </div>
                )}

                <details className="text-sm">
                  <summary className="cursor-pointer text-slate-500 hover:text-slate-700 select-none">
                    Need to reschedule?
                  </summary>
                  <div className="mt-3 space-y-3 pt-3 border-t border-surface-border">
                    <input
                      type="date"
                      value={schedDate}
                      min={minDate.toISOString().split("T")[0]}
                      onChange={(e) => setSchedDate(e.target.value)}
                      className="w-full border border-surface-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                    <input
                      type="time"
                      value={schedTime}
                      onChange={(e) => setSchedTime(e.target.value)}
                      className="w-full border border-surface-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!schedDate || scheduleMutation.isPending}
                      onClick={() =>
                        scheduleMutation.mutate({
                          id: selected.id,
                          scheduledAt: `${schedDate}T${schedTime}:00`,
                          notes: doctorNotes,
                        })
                      }
                    >
                      {scheduleMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Update Appointment
                    </Button>
                  </div>
                </details>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Post-appointment notes
                  </label>
                  <textarea
                    rows={3}
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    placeholder="Write your clinical summary or follow-up recommendations..."
                    className="w-full border border-surface-border rounded-lg p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>

                {reviewMutation.isError && (
                  <p className="text-xs text-red-600">
                    Failed to complete. Please try again.
                  </p>
                )}

                <Button
                  className="w-full"
                  disabled={reviewMutation.isPending}
                  onClick={() =>
                    reviewMutation.mutate({
                      id: selected.id,
                      notes: doctorNotes,
                    })
                  }
                >
                  {reviewMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Mark Appointment Complete
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* available slots form */
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-slate-500">
                  Set Appointment Date &amp; Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={schedDate}
                    min={minDate.toISOString().split("T")[0]}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="w-full border border-surface-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={schedTime}
                    onChange={(e) => setSchedTime(e.target.value)}
                    className="w-full border border-surface-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Doctor Notes (shown to patient)
                  </label>
                  <textarea
                    rows={3}
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    placeholder="Add any pre-appointment guidance or notes for the patient..."
                    className="w-full border border-surface-border rounded-lg p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
                {scheduleMutation.isError && (
                  <p className="text-xs text-red-600">
                    Failed to schedule. Please try again.
                  </p>
                )}
                <Button
                  className="w-full"
                  disabled={!schedDate || scheduleMutation.isPending}
                  onClick={() =>
                    scheduleMutation.mutate({
                      id: selected.id,
                      scheduledAt: `${schedDate}T${schedTime}:00`,
                      notes: doctorNotes,
                    })
                  }
                >
                  {scheduleMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Calendar className="h-4 w-4 mr-2" />
                  )}
                  Confirm Appointment
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // left case list
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Dermatologist Review Portal
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Review AI-triaged cases, schedule appointments, and write patient
          assessments.
        </p>
      </div>

      {/* filter tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(["pending", "scheduled", "reviewed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors",
              activeTab === tab
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            {tab}
            {counts[tab] > 0 && (
              <span
                className={cn(
                  "ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold",
                  tab === "pending"
                    ? "bg-red-500 text-white"
                    : "bg-slate-300 text-slate-700",
                )}
              >
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* patient tickets */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading consultations…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">
            {activeTab === "pending"
              ? "No pending consultations"
              : activeTab === "scheduled"
                ? "No scheduled appointments"
                : "No reviewed cases yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const analysis = c.analysis;
            return (
              <div
                key={c.id}
                onClick={() => {
                  setSelected(c);
                  setDoctorNotes(c.doctor_notes ?? "");
                  if (c.scheduled_at) {
                    const d = new Date(c.scheduled_at);
                    setSchedDate(d.toISOString().split("T")[0]);
                    setSchedTime(
                      `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`,
                    );
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(c);
                  }
                }}
                className="w-full text-left bg-white border border-surface-border rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all group cursor-pointer lg:relative"
              >
                {/* urgery indicator */}
                <div
                  className={cn(
                    "p-3 rounded-full ring-1 shrink-0",
                    RISK_COLORS[analysis?.risk_level ?? "LOW"],
                  )}
                >
                  {analysis?.risk_level === "LOW" ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </div>

                {/* basic patient data */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      {c.patient?.full_name ?? "Unknown Patient"}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full ring-1",
                        RISK_COLORS[analysis?.risk_level ?? "LOW"],
                      )}
                    >
                      {analysis?.risk_level ?? "—"} RISK
                    </span>
                    {analysis?.emergency_flag && (
                      <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                        🚨 EMERGENCY
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelative(c.created_at)}
                    </span>
                    {analysis && (
                      <span>
                        Confidence:{" "}
                        {((analysis.confidence ?? 0) * 100).toFixed(0)}%
                      </span>
                    )}
                    {c.preferred_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Prefers:{" "}
                        {new Date(c.preferred_date).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                    )}
                    {c.scheduled_at && (
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Scheduled:{" "}
                        {new Date(c.scheduled_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>

                  {c.patient_notes && (
                    <p className="text-xs text-slate-400 mt-1 italic truncate">
                      "{c.patient_notes}"
                    </p>
                  )}
                </div>

                {/* item action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {!c.doctor_id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        claimMutation.mutate(c.id);
                      }}
                      className="p-2 rounded-full text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      title="Claim Case"
                    >
                      <User className="h-4 w-4" />
                    </button>
                  )}
                  {c.doctor_id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setChatConsult(c);
                      }}
                      className="shrink-0 p-2 rounded-full text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      title="Message Patient"
                    >
                      <MessageSquare className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
