import { Phone, PhoneOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../config/supabase";
import { useWebRTC } from "../../hooks/useWebRTC";
import { VideoCallRoom } from "./VideoCallRoom";

// per-consultation listener — one hook per active consult
// avoids race condition: we subscribe before the doctor sends the offer
function ConsultationCallListener({
  consultationId,
  role,
  otherPartyName,
  myName,
}: {
  consultationId: string;
  role: "doctor" | "patient";
  otherPartyName: string;
  myName: string; // FIX 5: own name so VideoCallRoom can pass it to startCall
}) {
  const [showIncoming, setShowIncoming] = useState(false);
  const [showRoom, setShowRoom] = useState(false);
  const [callerName, setCallerName] = useState(otherPartyName);

  const handleIncomingCall = useCallback(
    (name: string) => {
      setCallerName(name || otherPartyName);
      setShowIncoming(true);
    },
    [otherPartyName],
  );

  const handleCallEnded = useCallback(() => {
    setShowIncoming(false);
    setShowRoom(false);
  }, []);

  // Use a ref so onSubscribed (a stable callback) can call the latest pingCallerReady
  // without creating a circular dependency in the hook call
  const pingRef = useRef<(() => void) | null>(null);

  const handleSubscribed = useCallback(() => {
    if (role === "patient") {
      pingRef.current?.();
    }
  }, [role]);

  const webRtcState = useWebRTC({
    consultationId,
    role,
    onIncomingCall: handleIncomingCall,
    onCallEnded: handleCallEnded,
    onSubscribed: handleSubscribed,
  });

  const { callState, acceptCall, endCall, pingCallerReady } = webRtcState;

  // Keep the ref up-to-date with the latest stable function from the hook
  useEffect(() => {
    pingRef.current = pingCallerReady;
  }, [pingCallerReady]);

  // Auto-dismiss incoming UI if the other party hung up
  useEffect(() => {
    if ((callState === "ended" || callState === "idle") && showIncoming) {
      // Defer to avoid cascading render warning during effect sync
      const timer = setTimeout(() => {
        if (showIncoming) setShowIncoming(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [callState, showIncoming]);

  const handleAccept = () => {
    setShowIncoming(false);
    setShowRoom(true);
    acceptCall();
  };

  const handleDecline = () => {
    setShowIncoming(false);
    endCall();
  };

  if (showRoom) {
    return (
      <VideoCallRoom
        consultationId={consultationId}
        role={role}
        otherPartyName={callerName}
        myName={myName}
        onClose={() => {
          setShowRoom(false);
          endCall();
        }}
        autoStart={false}
        webRtcState={webRtcState}
      />
    );
  }

  if (showIncoming) {
    return (
      <div className="fixed inset-0 z-[200] flex items-start justify-center pt-20 bg-slate-900/70 backdrop-blur-sm px-4 fade-in">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-slate-100 text-center">
          {/* Pulsing avatar */}
          <div className="relative mx-auto w-24 h-24 mb-5">
            <div className="absolute inset-0 rounded-full bg-green-400 opacity-20 animate-ping" />
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-green-500/30">
              {callerName.charAt(0).toUpperCase()}
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900">{callerName}</h2>
          <p className="text-slate-500 text-sm mt-1 mb-8">
            is calling you · Video consultation
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleDecline}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-6 py-3 rounded-xl transition-colors w-full justify-center border border-red-200"
            >
              <PhoneOff className="h-4 w-4" />
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors w-full justify-center shadow-lg shadow-green-600/25"
            >
              <Phone className="h-4 w-4" />
              Accept
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export function IncomingCallListener({
  role = "patient",
}: {
  role?: "doctor" | "patient";
}) {
  const [consultations, setConsultations] = useState<
    { id: string; otherPartyName: string }[]
  >([]);
  // FIX 5: Track the current user's own name to pass to VideoCallRoom
  const [myName, setMyName] = useState("");

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch own name to pass as caller identity
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (profile?.full_name) {
      const raw = profile.full_name as string;
      setMyName(
        role === "doctor" ? `Dr. ${raw.replace(/^Dr\.\s*/i, "")}` : raw,
      );
    }

    const columnFilter = role === "patient" ? "patient_id" : "doctor_id";
    const selectQuery =
      role === "patient"
        ? `id, profiles!consultations_doctor_id_fkey(full_name)`
        : `id, profiles!consultations_patient_id_fkey(full_name)`;

    const { data } = await supabase
      .from("consultations")
      .select(selectQuery)
      .eq(columnFilter, user.id)
      .in("status", ["pending", "scheduled", "reviewed", "closed"]);

    console.log(
      `[VideoCall] IncomingCallListener found ${data?.length || 0} active consultations for ${role}.`,
    );

    if (!data) return;

    setConsultations(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data as unknown as any[]).map((c) => ({
        id: c.id,
        otherPartyName: (Array.isArray(c.profiles) ? c.profiles[0] : c.profiles)
          ?.full_name
          ? role === "patient"
            ? `Dr. ${(c.profiles.full_name as string).replace(/^Dr\.\s*/i, "")}`
            : (c.profiles.full_name as string)
          : role === "patient"
            ? "Your Doctor"
            : "Patient",
      })),
    );
  }, [role]);

  useEffect(() => {
    let mounted = true;

    const safeLoad = async () => {
      if (mounted) await load();
    };

    safeLoad();

    // FIX 6: Re-fetch when new consultations are created while logged in
    const channel = supabase
      .channel(`consultations-changes-${role}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "consultations",
        },
        () => {
          if (mounted) safeLoad();
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [load, role]);

  return (
    <>
      {consultations.map((c) => (
        <ConsultationCallListener
          key={c.id}
          consultationId={c.id}
          role={role}
          otherPartyName={c.otherPartyName}
          myName={myName}
        />
      ))}
    </>
  );
}
