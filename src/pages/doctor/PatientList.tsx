import { useState } from "react";
import {
  Users,
  Search,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Loader2,
  Clock,
  Video,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent } from "../../components/core/Card";
import { Button } from "../../components/core/Button";
import { cn } from "../../utils/cn";
import { supabase } from "../../config/supabase";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { VideoCallRoom } from "../../components/shared/VideoCallRoom";
import { SecureTextChat } from "../../components/shared/SecureTextChat";

// ── Types ──────────────────────────────────────────────────────
interface PatientRecord {
  patientId: string;
  fullName: string;
  consultationId: string; // most recent consultation — used as call channel
  lastRiskLevel: string | null;
  lastConsultDate: string | null;
  totalConsults: number;
  hasOngoing: boolean;
  latestNotes: string | null;
}

const RISK_COLORS: Record<string, string> = {
  CRITICAL: "text-red-700 bg-red-50 ring-red-200",
  HIGH: "text-orange-700 bg-orange-50 ring-orange-200",
  MODERATE: "text-yellow-700 bg-yellow-50 ring-yellow-200",
  LOW: "text-green-700 bg-green-50 ring-green-200",
};

// ── Component ──────────────────────────────────────────────────
export function PatientList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [callPatient, setCallPatient] = useState<PatientRecord | null>(null);
  const [chatPatient, setChatPatient] = useState<PatientRecord | null>(null);

  const { data: patients = [], isLoading } = useQuery<PatientRecord[]>({
    queryKey: ["doctor-patient-directory"],
    queryFn: async () => {
      // Get the current doctor's user ID so we only show their patients
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("consultations")
        .select(
          `
          id, status, created_at, doctor_notes, scheduled_at,
          patient:profiles!consultations_patient_id_fkey(id, full_name),
          analysis:analysis_results(risk_level)
        `,
        )
        .eq("doctor_id", user.id) // 🔑 only this doctor's assigned patients
        .in("status", ["pending", "scheduled", "reviewed", "closed"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data) return [];

      const map = new Map<string, PatientRecord>();

      for (const c of data as any[]) {
        const p = c.patient;
        if (!p) continue;
        const id = p.id as string;

        if (!map.has(id)) {
          map.set(id, {
            patientId: id,
            fullName: p.full_name ?? "Unknown",
            consultationId: c.id,
            lastRiskLevel: c.analysis?.risk_level ?? null,
            lastConsultDate: c.scheduled_at ?? c.created_at,
            totalConsults: 1,
            hasOngoing: ["pending", "scheduled"].includes(c.status),
            latestNotes: c.doctor_notes ?? null,
          });
        } else {
          const rec = map.get(id)!;
          rec.totalConsults += 1;
          if (["pending", "scheduled"].includes(c.status))
            rec.hasOngoing = true;
        }
      }

      return Array.from(map.values()).sort((a, b) =>
        a.hasOngoing === b.hasOngoing ? 0 : a.hasOngoing ? -1 : 1,
      );
    },
    refetchInterval: 30_000,
  });

  const filtered = patients.filter((p) =>
    p.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Video call active ────────────────────────────────────────
  if (callPatient) {
    return (
      <VideoCallRoom
        consultationId={callPatient.consultationId}
        role="doctor"
        otherPartyName={callPatient.fullName}
        autoStart
        onClose={() => setCallPatient(null)}
      />
    );
  }

  // ── Chat active ──────────────────────────────────────────────
  if (chatPatient) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
        <div className="w-full max-w-3xl h-[80vh] shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <SecureTextChat
            consultationId={chatPatient.consultationId}
            role="doctor"
            otherPartyName={chatPatient.fullName}
            onClose={() => setChatPatient(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Patient Directory
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Patients with active or reviewed consultations.
          </p>
        </div>
        <div className="flex items-center bg-white border border-surface-border rounded-lg px-3 py-2.5 shadow-sm max-w-xs w-full">
          <Search className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="border-none focus:ring-0 text-sm flex-1 outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading patients…
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-20">
          <CardContent>
            <div className="flex flex-col items-center text-slate-400 space-y-4">
              <div className="bg-slate-50 p-6 rounded-full">
                <Users className="w-14 h-14 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-600">
                {search ? "No patients match your search" : "No patients yet"}
              </h3>
              <p className="max-w-sm text-sm text-center">
                {search
                  ? "Try a different name."
                  : "Once you review cases from the triage portal, patients will appear here."}
              </p>
              {!search && (
                <button
                  onClick={() => navigate("/doctor")}
                  className="mt-2 text-sm text-primary-600 underline font-medium"
                >
                  Go to Review Portal →
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div
              key={p.patientId}
              className="bg-white border border-surface-border rounded-xl p-4 flex items-center gap-4"
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-primary-100 text-primary-700 font-bold text-lg flex items-center justify-center shrink-0 uppercase">
                {p.fullName.charAt(0)}
              </div>

              {/* Info */}
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => navigate("/doctor")}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900">
                    {p.fullName}
                  </span>
                  {p.hasOngoing && (
                    <span className="text-xs bg-amber-100 text-amber-700 ring-1 ring-amber-200 px-2 py-0.5 rounded-full font-medium">
                      Active case
                    </span>
                  )}
                  {p.lastRiskLevel && (
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium ring-1",
                        RISK_COLORS[p.lastRiskLevel] ??
                          "bg-slate-100 text-slate-600",
                      )}
                    >
                      {p.lastRiskLevel}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {p.totalConsults} consultation
                    {p.totalConsults !== 1 ? "s" : ""}
                  </span>
                  {p.lastConsultDate && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last:{" "}
                      {new Date(p.lastConsultDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setChatPatient(p)}
                  className="flex items-center gap-1.5 text-slate-700 bg-white"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Chat
                </Button>
                <Button
                  size="sm"
                  onClick={() => setCallPatient(p)}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Video className="h-3.5 w-3.5" />
                  Call
                </Button>

                <button
                  onClick={() => navigate("/doctor")}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  title="View consultation"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Status icon */}
              <div className="shrink-0">
                {p.hasOngoing ? (
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
