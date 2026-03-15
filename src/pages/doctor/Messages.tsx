import { useQuery } from "@tanstack/react-query";
import { Inbox, MessageSquare, Search, Video, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { SecureTextChat } from "../../components/shared/SecureTextChat";
import { VideoCallRoom } from "../../components/shared/VideoCallRoom";
import { supabase } from "../../config/supabase";
import { cn } from "../../utils/cn";

interface Consultation {
  id: string;
  status: string;
  patient_id: string;
  created_at: string;
  patient: {
    full_name: string;
  } | null;
  last_message?: {
    content: string;
    created_at: string;
  };
}

export default function DoctorMessages() {
  const location = useLocation();
  const [selectedId, setSelectedId] = useState<string | null>(
    location.state?.selectedId || null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [callConsultId, setCallConsultId] = useState<string | null>(null);
  const [callPatientName, setCallPatientName] = useState("");

  const { data: consultations = [], isLoading } = useQuery<Consultation[]>({
    queryKey: ["doctor-messages-list"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("consultations")
        .select(
          `
          id, status, created_at, patient_id,
          patient:profiles!consultations_patient_id_fkey(full_name)
        `,
        )
        .eq("doctor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const consultationsWithLastMsg = await Promise.all(
        (data || []).map(async (c) => {
          const { data: msg } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("consultation_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...c,
            last_message: msg || undefined,
          };
        }),
      );

      return consultationsWithLastMsg as unknown as Consultation[];
    },
    refetchInterval: 30_000,
  });

  const filtered = consultations.filter((c) =>
    c.patient?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedConsultation = consultations.find((c) => c.id === selectedId);

  const handleStartCall = (consult: Consultation) => {
    setCallConsultId(consult.id);
    setCallPatientName(consult.patient?.full_name || "Patient");
  };

  return (
    <div className="h-[calc(100vh-120px)] flex bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 relative">
      {/* Video call overlay */}
      {callConsultId && (
        <div className="absolute inset-0 z-50 bg-slate-900/95 flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Video className="w-5 h-5 text-emerald-400" />
              <span className="font-semibold text-white">
                Video Call with {callPatientName}
              </span>
            </div>
            <button
              onClick={() => setCallConsultId(null)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close call"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <VideoCallRoom
              consultationId={callConsultId}
              role="doctor"
              otherPartyName={callPatientName}
              onClose={() => setCallConsultId(null)}
              autoStart={true}
            />
          </div>
        </div>
      )}

      {/* Sidebar List */}
      <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
        <div className="p-6 border-b border-slate-100 bg-white">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            Messages
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-slate-100 animate-pulse rounded-2xl"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Inbox className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                No conversations found
              </p>
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl transition-all flex flex-col gap-1 relative group",
                  selectedId === c.id
                    ? "bg-white shadow-md ring-1 ring-primary-100"
                    : "hover:bg-white/60 text-slate-600",
                )}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-slate-900 truncate">
                    {c.patient?.full_name || "Unknown Patient"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                    {c.last_message
                      ? new Date(c.last_message.created_at).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" },
                        )
                      : ""}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {c.last_message?.content || "No messages yet"}
                </p>
                {selectedId === c.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full" />
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat + Call Area */}
      <div className="flex-1 bg-slate-50/30 flex flex-col">
        {selectedConsultation ? (
          <div className="h-full flex flex-col">
            {/* Toolbar with video call button */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white shrink-0">
              <span className="font-semibold text-slate-700">
                {selectedConsultation.patient?.full_name || "Patient"}
              </span>
              <button
                onClick={() => handleStartCall(selectedConsultation)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors shadow-sm"
                title="Start video call"
              >
                <Video className="w-4 h-4" />
                Video Call
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <SecureTextChat
                consultationId={selectedConsultation.id}
                role="doctor"
                otherPartyName={
                  selectedConsultation.patient?.full_name || "Patient"
                }
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mb-6 text-primary-600">
              <MessageSquare className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Your Conversations
            </h3>
            <p className="max-w-xs text-sm leading-relaxed">
              Select a patient from the list on the left to view the secure
              consultation history and start a video call.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
