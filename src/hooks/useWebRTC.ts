import type { RealtimeChannel } from "@supabase/supabase-js";
import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
} from "agora-rtc-sdk-ng";
import AgoraRTC from "agora-rtc-sdk-ng";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../config/supabase";

const APP_ID = import.meta.env.VITE_AGORA_APP_ID as string;

if (!APP_ID) {
  console.error("[VideoCall] VITE_AGORA_APP_ID is not set in .env.local");
}

// turn an Agora/browser error into a readable message
function describeCallError(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as { code?: string; message?: string; name?: string };

    // Explicit permission/not-allowed errors
    if (
      e.code === "PERMISSION_DENIED" ||
      e.name === "NotAllowedError" ||
      e.name === "PermissionDeniedError"
    ) {
      return "Camera or microphone access was denied. Please check your browser settings and try again.";
    }

    // Agora join errors (bad App ID, expired token, etc.)
    if (
      e.code === "INVALID_VENDOR_KEY" ||
      e.code === "DYNAMIC_USE_STATIC_KEY"
    ) {
      return "Invalid Agora App ID. Check VITE_AGORA_APP_ID in .env.local.";
    }
    if (e.code === "NO_AVAILABLE_CHANNEL") {
      return "Could not connect to video server. Please try again.";
    }

    // Devices not found
    if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
      return "No camera or microphone found. Please connect a device and try again.";
    }

    if (e.message) return e.message;
  }

  if (typeof err === "string") return err;

  return "Video call failed. Please check your camera/microphone and try again.";
}

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
  role?: "doctor" | "patient";
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

  // Agora client
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  // Local tracks
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  // Remote tracks
  const remoteVideoTrackRef = useRef<IRemoteVideoTrack | null>(null);
  const remoteAudioTrackRef = useRef<IRemoteAudioTrack | null>(null);

  // Supabase signaling channel (ring / hang-up only)
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);

  // Shared refs for video containers (VideoCallRoom attaches DOM div refs here)
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Container divs – VideoCallRoom sets these so we can call .play()
  const localContainerRef = useRef<HTMLDivElement | null>(null);
  const remoteContainerRef = useRef<HTMLDivElement | null>(null);

  const callStateRef = useRef<CallState>("idle");
  const syncCallState = (s: CallState) => {
    callStateRef.current = s;
    setCallState(s);
  };

  const channelName = `call:${consultationId}`;
  // Agora channel names must be alphanumeric — strip hyphens from UUID
  const agoraChannel = consultationId.replace(/-/g, "");

  // ── Auto-play tracks when containers become available ──────
  useEffect(() => {
    if (localContainerRef.current && localVideoTrackRef.current) {
      localVideoTrackRef.current.play(localContainerRef.current);
    }
  }, []);

  useEffect(() => {
    if (remoteContainerRef.current && remoteVideoTrackRef.current) {
      remoteVideoTrackRef.current.play(remoteContainerRef.current);
    }
  }, []);

  // ── Create / get Agora client ─────────────────────────────
  const getClient = useCallback(() => {
    if (!clientRef.current) {
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      // Remote user published their tracks
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video") {
          remoteVideoTrackRef.current = user.videoTrack ?? null;
          if (remoteContainerRef.current && user.videoTrack) {
            user.videoTrack.play(remoteContainerRef.current);
          }
          syncCallState("connected");
        }
        if (mediaType === "audio") {
          remoteAudioTrackRef.current = user.audioTrack ?? null;
          user.audioTrack?.play();
        }
      });

      client.on("user-unpublished", (_user, mediaType) => {
        if (mediaType === "video") {
          remoteVideoTrackRef.current = null;
        }
        if (mediaType === "audio") {
          remoteAudioTrackRef.current = null;
        }
      });

      client.on("user-left", () => {
        syncCallState("ended");
        onCallEnded?.();
      });
    }
    return clientRef.current;
  }, [onCallEnded]);

  // ── Supabase signaling (ring / hang-up) ──────────────────
  useEffect(() => {
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "call-request" }, ({ payload }) => {
        console.log("[VideoCall] Incoming call-request broadcast:", payload);
        syncCallState("incoming");
        onIncomingCall?.(payload.callerName ?? "");
      })
      .on("broadcast", { event: "call-ended" }, () => {
        console.log("[VideoCall] Incoming call-ended broadcast.");
        syncCallState("ended");
        onCallEnded?.();
        cleanup(false);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          isSubscribedRef.current = true;
        }
      });

    channelRef.current = channel;

    return () => {
      isSubscribedRef.current = false;
      channel.unsubscribe();
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName]);

  // ── Acquire camera + mic ──────────────────────────────────
  const getLocalTracks = useCallback(async () => {
    console.log("[VideoCall] Acquiring local tracks...");
    let audioTrack = localAudioTrackRef.current;
    let videoTrack = localVideoTrackRef.current;
    let lastErr: unknown = null;

    if (!audioTrack) {
      try {
        audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioTrackRef.current = audioTrack;
        console.log("[VideoCall] Microphone acquired.");
      } catch (err) {
        console.warn("[VideoCall] Could not acquire microphone track:", err);
        lastErr = err;
      }
    }

    if (!videoTrack) {
      try {
        videoTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: "720p_1",
        });
        localVideoTrackRef.current = videoTrack;
        console.log("[VideoCall] Camera acquired.");

        // Play local preview into container if ready
        if (localContainerRef.current) {
          videoTrack.play(localContainerRef.current);
        }
      } catch (err) {
        console.warn("[VideoCall] Could not acquire camera track:", err);
        lastErr = err;
      }
    }

    if (!audioTrack && !videoTrack) {
      // If we have a specific error, throw it so describeCallError can use it
      if (lastErr) throw lastErr;

      throw new Error(
        "Could not access camera or microphone. Please allow permissions or connect a device.",
      );
    }

    return { audioTrack, videoTrack };
  }, []);

  // ── Join Agora channel and publish ────────────────────────
  const joinAndPublish = useCallback(async () => {
    const client = getClient();
    console.log("[VideoCall] Agora client state:", client.connectionState);
    if (client.connectionState !== "DISCONNECTED") return;

    // CRITICAL: Request tracks FIRST to ensure we are in a User Activation context.
    // Waiting for a join network request often breaks the user gesture bubble.
    const { audioTrack, videoTrack } = await getLocalTracks();

    console.log(`[VideoCall] Joining Agora channel: ${agoraChannel}...`);
    // Note: Passing null as token works if the project is in App ID testing mode (no certificate).
    await client.join(APP_ID, agoraChannel, null, null);
    console.log("[VideoCall] Joined Agora channel successfully.");

    const tracks = [];
    if (audioTrack) tracks.push(audioTrack);
    if (videoTrack) tracks.push(videoTrack);

    if (tracks.length > 0) {
      console.log(`[VideoCall] Publishing ${tracks.length} tracks...`);
      await client.publish(tracks);
      console.log("[VideoCall] Published tracks successfully.");
    }

    syncCallState("connected");
  }, [getClient, getLocalTracks, agoraChannel]);

  // ── Start call (caller) ───────────────────────────────────
  const startCall = useCallback(
    async (myName = "") => {
      try {
        console.log("[VideoCall] Initiating call as:", myName);
        setError(null);
        syncCallState("calling");

        // Notify the other party securely after channel is subscribed
        let attempts = 0;
        const maxAttempts = 5; // Send signaling multiple times to be safe

        const sendOffer = () => {
          if (isSubscribedRef.current && channelRef.current) {
            console.log(
              `[VideoCall] Sending call-request broadcast (attempt ${attempts + 1})...`,
            );
            channelRef.current.send({
              type: "broadcast",
              event: "call-request",
              payload: { callerName: myName },
            });

            if (attempts < maxAttempts) {
              attempts++;
              setTimeout(sendOffer, 1000); // Re-send every second for a few seconds
            }
          } else if (attempts < 50) {
            attempts++;
            setTimeout(sendOffer, 200);
          }
        };
        sendOffer();

        syncCallState("connecting");
        await joinAndPublish();
      } catch (err) {
        const msg = describeCallError(err);
        console.error("[VideoCall] startCall failed:", err);
        setError(msg);
        syncCallState("error");
      }
    },
    [joinAndPublish],
  );

  // ── Accept call (callee) ──────────────────────────────────
  const acceptCall = useCallback(async () => {
    try {
      syncCallState("connecting");
      await joinAndPublish();
    } catch (err) {
      const msg = describeCallError(err);
      console.error("[VideoCall] acceptCall failed:", err);
      setError(msg);
      syncCallState("error");
    }
  }, [joinAndPublish]);

  // ── Cleanup ───────────────────────────────────────────────
  const cleanup = useCallback((sendSignal = true) => {
    if (sendSignal && channelRef.current) {
      // Best effort send if subscribed, else assume it's unneeded
      if (isSubscribedRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "call-ended",
          payload: {},
        });
      }
    }
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.stop();
      localVideoTrackRef.current.close();
      // Also stop the underlying MediaStreamTrack if it exists
      const mediaStreamTrack = localVideoTrackRef.current.getMediaStreamTrack();
      if (mediaStreamTrack) {
        mediaStreamTrack.stop();
      }
    }
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.stop();
      localAudioTrackRef.current.close();
      const mediaStreamTrack = localAudioTrackRef.current.getMediaStreamTrack();
      if (mediaStreamTrack) {
        mediaStreamTrack.stop();
      }
    }

    localVideoTrackRef.current = null;
    localAudioTrackRef.current = null;
    remoteVideoTrackRef.current = null;
    remoteAudioTrackRef.current = null;

    const client = clientRef.current;
    if (client && client.connectionState !== "DISCONNECTED") {
      client.leave().catch(() => {});
    }
  }, []);

  const endCall = useCallback(() => {
    cleanup(true);
    syncCallState("ended");
    onCallEnded?.();
  }, [cleanup, onCallEnded]);

  // ── Toggle helpers (used by VideoCallRoom controls) ───────
  const setMicEnabled = useCallback((enabled: boolean) => {
    localAudioTrackRef.current?.setEnabled(enabled);
  }, []);

  const setCamEnabled = useCallback((enabled: boolean) => {
    localVideoTrackRef.current?.setEnabled(enabled);
  }, []);

  return {
    callState,
    error,
    // kept for API compatibility with VideoCallRoom (not used for srcObject anymore)
    localVideoRef,
    remoteVideoRef,
    // New: container refs that Agora plays into
    localContainerRef,
    remoteContainerRef,
    startCall,
    acceptCall,
    endCall,
    setMicEnabled,
    setCamEnabled,
  };
}
