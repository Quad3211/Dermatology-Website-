/**
 * useAnalysisRealtime — Supabase Realtime subscription + React Query fallback.
 *
 * Preferred delivery path: WebSocket push via postgres_changes.
 * Fallback: React Query polling every 3s (existing useAnalysis hook behaviour).
 * The fallback activates automatically when WebSocket is unavailable.
 */
import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../config/supabase";
import { api, type AnalysisResponse } from "../services/api";

interface UseAnalysisRealtimeOptions {
  analysisId: string | null;
  onComplete?: (result: AnalysisResponse) => void;
  onEmergency?: (result: AnalysisResponse) => void;
}

export function useAnalysisRealtime({
  analysisId,
  onComplete,
  onEmergency,
}: UseAnalysisRealtimeOptions) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── React Query (fallback polling) ────────────────────────────
  const query = useQuery<AnalysisResponse>({
    queryKey: ["analysis", analysisId],
    queryFn: () => api.analysis.getById(analysisId!),
    enabled: !!analysisId,
    // Only poll if Realtime is not connected and status is active
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (!status || status === "complete" || status === "failed") return false;
      // Poll every 3s as fallback
      return 3000;
    },
    staleTime: 0,
  });

  // ── Supabase Realtime subscription ────────────────────────────
  useEffect(() => {
    if (!analysisId) return;

    const channel = supabase
      .channel(`analysis:${analysisId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "analysis_results",
          filter: `id=eq.${analysisId}`,
        },
        (payload) => {
          const updated = payload.new as AnalysisResponse;
          // Push update directly into React Query cache — no fetch needed
          queryClient.setQueryData(["analysis", analysisId], updated);
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [analysisId, queryClient]);

  // ── Side effects on completion ────────────────────────────────
  useEffect(() => {
    const data = query.data;
    if (!data) return;
    if (data.status === "complete") {
      onComplete?.(data);
      if (data.emergencyFlag) {
        onEmergency?.(data);
      }
    }
  }, [query.data?.status, query.data?.emergencyFlag]);

  return query;
}
