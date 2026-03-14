/**
 * React Query hook for polling analysis results.
 * Auto-polls every 3s while status is queued/processing.
 * Pushes emergency alerts via a callback when status is CRITICAL.
 */
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { api, type AnalysisResponse } from "../services/api";

interface UseAnalysisOptions {
  analysisId: string | null;
  onComplete?: (result: AnalysisResponse) => void;
  onEmergency?: (result: AnalysisResponse) => void;
}

export function useAnalysis({
  analysisId,
  onComplete,
  onEmergency,
}: UseAnalysisOptions) {
  const query = useQuery<AnalysisResponse>({
    queryKey: ["analysis", analysisId],
    queryFn: () => api.analysis.getById(analysisId!),
    enabled: !!analysisId,
    // Poll every 3s while processing
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || status === "complete" || status === "failed") return false;
      return 3000;
    },
    staleTime: 0,
  });

  // Side effects on completion
  useEffect(() => {
    if (!query.data) return;

    if (query.data.status === "complete") {
      onComplete?.(query.data);
      if (query.data.emergencyFlag) {
        onEmergency?.(query.data);
      }
    }
  }, [query.data?.status, query.data?.emergencyFlag]);

  return query;
}
