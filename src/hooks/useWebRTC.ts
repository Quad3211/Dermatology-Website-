import { useEffect, useRef, useCallback, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
} from "agora-rtc-sdk-ng";
import { supabase } from "../config/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

const APP_ID = import.meta.env.VITE_AGORA_APP_ID as string;

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
  // Use consultationId as Agora channel name (alphanumeric-safe)
  const agoraChannel = consultationId;

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
        syncCallState("incoming");
        onIncomingCall?.(payload.callerName ?? "");
      })
      .on("broadcast", { event: "call-ended" }, () => {
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
    let audioTrack = localAudioTrackRef.current;
    let videoTrack = localVideoTrackRef.current;

    if (!audioTrack) {
      try {
        audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioTrackRef.current = audioTrack;
      } catch (err) {
        console.warn("Could not acquire microphone track:", err);
      }
    }

    if (!videoTrack) {
      try {
        videoTrack = await AgoraRTC.createCameraVideoTrack({ encoderConfig: "720p_1" });
        localVideoTrackRef.current = videoTrack;

        // Play local preview into container if ready
        if (localContainerRef.current) {
          videoTrack.play(localContainerRef.current);
        }
      } catch (err) {
        console.warn("Could not acquire camera track:", err);
      }
    }

    if (!audioTrack && !videoTrack) {
      throw new Error("Could not access camera or microphone. Please allow permissions or connect a device.");
    }

    return { audioTrack, videoTrack };
  }, []);

  // ── Join Agora channel and publish ────────────────────────
  const joinAndPublish = useCallback(
    async () => {
      const client = getClient();
      if (client.connectionState !== "DISCONNECTED") return;

      // Note: Passing null as token works if the project is in App ID testing mode (no certificate).
      await client.join(APP_ID, agoraChannel, null, null);
      
      const { audioTrack, videoTrack } = await getLocalTracks();
      
      const tracks = [];
      if (audioTrack) tracks.push(audioTrack);
      if (videoTrack) tracks.push(videoTrack);
      
      if (tracks.length > 0) {
        await client.publish(tracks);
      }
      
      syncCallState("connected");
    },
    [getClient, getLocalTracks, agoraChannel],
  );

  // ── Start call (caller) ───────────────────────────────────
  const startCall = useCallback(
    async (myName = "") => {
      try {
        setError(null);
        syncCallState("calling");

        // Notify the other party securely after channel is subscribed
        let attempts = 0;
        const trySendCall = () => {
          if (isSubscribedRef.current && channelRef.current) {
            channelRef.current.send({
              type: "broadcast",
              event: "call-request",
              payload: { callerName: myName },
            });
          } else if (attempts < 50) {
            attempts++;
            setTimeout(trySendCall, 100);
          }
        };
        trySendCall();

        syncCallState("connecting");
        await joinAndPublish();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not access camera/microphone.";
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
      const msg = err instanceof Error ? err.message : "Could not access camera/microphone.";
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
    localVideoTrackRef.current?.stop();
    localVideoTrackRef.current?.close();
    localAudioTrackRef.current?.stop();
    localAudioTrackRef.current?.close();
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
