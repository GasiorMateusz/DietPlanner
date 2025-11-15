import { useState, useEffect, useCallback } from "react";
import { multiDayPlansApi } from "@/lib/api/multi-day-plans.client";
import type { GetMultiDayPlanByIdResponseDto } from "@/types";

interface UseMultiDayPlanReturn {
  planData: GetMultiDayPlanByIdResponseDto | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useMultiDayPlan(planId: string): UseMultiDayPlanReturn {
  const [planData, setPlanData] = useState<GetMultiDayPlanByIdResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPlan = useCallback(async () => {
    if (!planId) {
      setError(new Error("Plan ID is required"));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await multiDayPlansApi.getById(planId);
      setPlanData(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load plan"));
      setPlanData(null);
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  return { planData, isLoading, error, refetch: fetchPlan };
}

