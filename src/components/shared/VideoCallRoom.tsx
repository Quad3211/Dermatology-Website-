import {
  AlertTriangle,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Shield,
  Video,
  VideoOff,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CallState } from "../../hooks/useWebRTC";
import { useWebRTC } from "../../hooks/useWebRTC";
import { Button } from "../core/Button";

interface VideoCallRoomProps {
  consultationId: string;
  role: "doctor" | "patient";
  otherPartyName: string;
  myName?: string;
  onClose: () => void;
  autoStart?: boolean;
  webRtcState?: ReturnType<typeof useWebRTC>;
}

// ── Inner component — owns its own Agora hook ──────────────
// Only rendered when the parent did NOT provide webRtcState.
function VideoCallRoomOwned({
  consultationId,
  role,
  otherPartyName,
  myName,
  onClose,
  autoStart,
}: Omit<VideoCallRoomProps, "webRtcState">) {
  const rtc = useWebRTC({
    consultationId,
    role,
    onCallEnded: onClose,
  });

  return (
    <VideoCallRoomUI
      rtc={rtc}
      role={role}
      otherPartyName={otherPartyName}
      myName={myName}
      onClose={onClose}
      autoStart={autoStart}
    />
  );
}

// ── Exported component — delegates hook ownership ──────────
export function VideoCallRoom({
  consultationId,
  role,
  otherPartyName,
  myName,
  onClose,
  autoStart = false,
  webRtcState,
}: VideoCallRoomProps) {
  if (webRtcState) {
    return (
      <VideoCallRoomUI
        rtc={webRtcState}
        role={role}
        otherPartyName={otherPartyName}
        myName={myName}
        onClose={onClose}
        autoStart={autoStart}
      />
    );
  }

  return (
    <VideoCallRoomOwned
      consultationId={consultationId}
      role={role}
      otherPartyName={otherPartyName}
      myName={myName}
      onClose={onClose}
      autoStart={autoStart}
    />
  );
}

// ── UI — shared by both paths ──────────────────────────────
function VideoCallRoomUI({
  rtc,
  role,
  otherPartyName,
  myName,
  onClose,
  autoStart,
}: {
  rtc: ReturnType<typeof useWebRTC>;
  role: "doctor" | "patient";
  otherPartyName: string;
  myName?: string;
  onClose: () => void;
  autoStart?: boolean;
}) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // These are the container divs Agora renders video into
  const localDivRef = useRef<HTMLDivElement>(null);
  const remoteDivRef = useRef<HTMLDivElement>(null);

  const {
    callState,
    error,
    localContainerRef,
    remoteContainerRef,
    startCall,
    acceptCall,
    endCall,
    setMicEnabled,
    setCamEnabled,
  } = rtc;

  // Wire our div refs into the hook's container refs so Agora can call .play()
  useEffect(() => {
    localContainerRef.current = localDivRef.current;
    remoteContainerRef.current = remoteDivRef.current;

    return () => {
      localContainerRef.current = null;
      remoteContainerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-start the call when the component renders as the caller
  useEffect(() => {
    if (autoStart && callState === "idle") {
      startCall(myName ?? role);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const toggleMic = () => {
    const next = !micOn;
    setMicEnabled?.(next);
    setMicOn(next);
  };

  const toggleCam = () => {
    const next = !camOn;
    setCamEnabled?.(next);
    setCamOn(next);
  };

  const stateLabel: Record<CallState, string> = {
    idle: "Ready",
    calling: "Calling…",
    incoming: "Incoming call",
    connecting: "Connecting…",
    connected: `Connected with ${otherPartyName}`,
    ended: "Call ended",
    error: "Error",
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary-400" />
          <div>
            <p className="text-white font-semibold text-sm">
              Secure Consultation
            </p>
            <p className="text-slate-400 text-xs">{otherPartyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              callState === "connected"
                ? "bg-green-900 text-green-300"
                : callState === "error"
                  ? "bg-red-900 text-red-300"
                  : "bg-slate-700 text-slate-300"
            }`}
          >
            {stateLabel[callState]}
          </span>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative bg-slate-950 overflow-hidden">
        {/* Remote video — Agora plays into this div */}
        <div ref={remoteDivRef} className="w-full h-full" />

        {/* Placeholder when not connected */}
        {callState !== "connected" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-4">
            <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center text-4xl font-bold uppercase">
              {otherPartyName.charAt(0)}
            </div>
            <p className="text-xl font-semibold">{otherPartyName}</p>

            {(callState === "calling" || callState === "connecting") && (
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{stateLabel[callState]}</span>
              </div>
            )}

            {callState === "incoming" && role === "patient" && (
              <div className="flex gap-3 mt-4">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white px-8"
                  onClick={acceptCall}
                >
                  Accept
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white px-8"
                  onClick={() => {
                    endCall();
                    onClose();
                  }}
                >
                  Decline
                </Button>
              </div>
            )}

            {callState === "idle" && role === "doctor" && !autoStart && (
              <Button
                onClick={() => startCall(myName ?? role)}
                className="mt-4"
              >
                Start Call
              </Button>
            )}

            {callState === "ended" && (
              <div className="text-center space-y-3">
                <p className="text-slate-400 text-sm">Call has ended.</p>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            )}

            {(callState === "error" || error) && (
              <div className="flex items-start gap-2 bg-red-900/40 border border-red-700 rounded-xl p-4 max-w-sm text-center">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 text-sm font-medium">
                    Call failed
                  </p>
                  <p className="text-red-400 text-xs mt-1">
                    {error ??
                      "Please allow camera & microphone access and try again."}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Local video PiP — Agora plays into this div */}
        <div
          ref={localDivRef}
          className="absolute bottom-6 right-6 w-48 h-36 rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-900"
        />
      </div>

      {/* Controls */}
      <div className="bg-slate-900 border-t border-slate-800 px-6 py-5 flex items-center justify-center gap-4">
        <button
          onClick={toggleMic}
          className={`p-4 rounded-full transition-colors ${
            micOn
              ? "bg-slate-700 hover:bg-slate-600 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
          title={micOn ? "Mute" : "Unmute"}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>

        <button
          onClick={toggleCam}
          className={`p-4 rounded-full transition-colors ${
            camOn
              ? "bg-slate-700 hover:bg-slate-600 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
          title={camOn ? "Stop camera" : "Start camera"}
        >
          {camOn ? (
            <Video className="h-5 w-5" />
          ) : (
            <VideoOff className="h-5 w-5" />
          )}
        </button>

        <button
          onClick={() => {
            endCall();
            onClose();
          }}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
          title="End call"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
