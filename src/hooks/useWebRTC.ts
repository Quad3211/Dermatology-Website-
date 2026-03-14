import { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../config/supabase";

// STUN/TURN config
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

export type CallState =
  | "idle"
  | "calling"
  | "incoming"
  | "connecting"
  | "connected"
  | "ended"
  | "error";

interface UseWebRTCOptions {
  consultationId: string;
  role?: "doctor" | "patient"; // kept for API compatibility
  onIncomingCall?: (callerName: string) => void;
  onCallEnded?: () => void;
}

export function useWebRTC({
  consultationId,
  onIncomingCall,
  onCallEnded,
}: UseWebRTCOptions) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);

  // callStateRef keeps state readable inside stale closures
  const callStateRef = useRef<CallState>("idle");
  const syncCallState = (s: CallState) => {
    callStateRef.current = s;
    setCallState(s);
  };

  // buffer ICE candidates that arrive before setRemoteDescription
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // Exposed refs for video elements (VideoCallRoom attaches DOM nodes here)
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const channelName = `call:${consultationId}`;

  // init peer connection
  const createPC = useCallback(() => {
    // Clean up any existing PC before creating a new one
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: { candidate: candidate.toJSON() },
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        syncCallState("connected");
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "connected") {
        syncCallState("connected");
      } else if (["disconnected", "failed", "closed"].includes(state)) {
        syncCallState("ended");
        onCallEnded?.();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [onCallEnded]);

  // request mic/camera
  const getLocalMedia = useCallback(async () => {
    // Reuse existing stream if already acquired
    if (localStreamRef.current) return localStreamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
      audio: true,
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  }, []);

  // flush buffered ICE candidates
  const drainIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
    const buffered = pendingIceCandidatesRef.current.splice(0);
    for (const candidate of buffered) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (_) {
        // Ignore stale candidates
      }
    }
  }, []);

  // callee receives an offer
  const handleOffer = useCallback(
    async (sdp: RTCSessionDescriptionInit) => {
      syncCallState("connecting");
      const pc = createPC();
      const stream = await getLocalMedia();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));

      // FIX 2: Now that remote description is set, drain any buffered candidates
      await drainIceCandidates(pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      channelRef.current?.send({
        type: "broadcast",
        event: "answer",
        payload: { sdp: answer },
      });
    },
    [createPC, getLocalMedia, drainIceCandidates],
  );

  // signaling channel subscription
  useEffect(() => {
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      // Incoming call notification
      .on("broadcast", { event: "call-request" }, ({ payload }) => {
        syncCallState("incoming");
        onIncomingCall?.(payload.callerName ?? "");
      })
      // Offer from caller — store it; process on accept
      .on("broadcast", { event: "offer" }, async ({ payload }) => {
        // FIX 1: Use ref to read current callState (not stale closure value)
        if (callStateRef.current === "connecting") {
          // Already accepted — process immediately
          await handleOffer(payload.sdp);
        } else {
          // Store for later (callee may still be on the accept screen)
          pendingOfferRef.current = payload.sdp;
        }
      })
      // Answer from the callee
      .on("broadcast", { event: "answer" }, async ({ payload }) => {
        if (pcRef.current && pcRef.current.signalingState !== "closed") {
          try {
            await pcRef.current.setRemoteDescription(
              new RTCSessionDescription(payload.sdp),
            );
            // FIX 2: Drain any ICE candidates buffered before answer arrived
            await drainIceCandidates(pcRef.current);
          } catch (e) {
            console.warn("[WebRTC] Failed to set remote answer:", e);
          }
        }
      })
      // ICE candidates — buffer if remote description not set yet
      .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
        if (!payload.candidate) return;

        const pc = pcRef.current;
        if (pc && pc.remoteDescription && pc.signalingState !== "closed") {
          // FIX 2: Remote description already set — add immediately
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (_) {
            // Ignore stale candidates
          }
        } else {
          // FIX 2: Buffer until remote description is available
          pendingIceCandidatesRef.current.push(payload.candidate);
        }
      })
      // Remote hung up
      .on("broadcast", { event: "call-ended" }, () => {
        syncCallState("ended");
        onCallEnded?.();
        cleanup(false);
      })
      // Callee accepted — caller re-sends offer (in case it was lost)
      .on("broadcast", { event: "call-accepted" }, async () => {
        // FIX 1: Use ref to read current callState non-stale
        if (callStateRef.current !== "calling" || !pcRef.current) return;
        const offer = pcRef.current.localDescription;
        if (offer) {
          channelRef.current?.send({
            type: "broadcast",
            event: "offer",
            payload: { sdp: offer },
          });
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName]);

  // caller starts the call
  const startCall = useCallback(
    async (myName = "") => {
      try {
        setError(null);
        syncCallState("calling");

        channelRef.current?.send({
          type: "broadcast",
          event: "call-request",
          payload: { callerName: myName },
        });

        const pc = createPC();
        const stream = await getLocalMedia();
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Send offer immediately — callee stores it until they accept
        channelRef.current?.send({
          type: "broadcast",
          event: "offer",
          payload: { sdp: offer },
        });
      } catch (_err) {
        setError(
          "Could not access camera/microphone. Please allow permissions.",
        );
        syncCallState("error");
      }
    },
    [createPC, getLocalMedia],
  );

  // callee accepts
  const acceptCall = useCallback(async () => {
    syncCallState("connecting");

    if (pendingOfferRef.current) {
      // We already received the offer — process it now
      await handleOffer(pendingOfferRef.current);
      pendingOfferRef.current = null;
    } else {
      // Offer not received yet — signal readiness to caller
      // The offer handler above will process it when it arrives
      channelRef.current?.send({
        type: "broadcast",
        event: "call-accepted",
        payload: {},
      });
    }
  }, [handleOffer]);

  // tear down
  const cleanup = useCallback((sendSignal = true) => {
    if (sendSignal && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "call-ended",
        payload: {},
      });
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    localStreamRef.current = null;
    pcRef.current = null;
    pendingOfferRef.current = null;
    pendingIceCandidatesRef.current = [];
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, []);

  const endCall = useCallback(() => {
    cleanup(true);
    syncCallState("ended");
    onCallEnded?.();
  }, [cleanup, onCallEnded]);

  return {
    callState,
    error,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    endCall,
  };
}
