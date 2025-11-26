import { useState, useCallback } from "react";
import type { MultiDayPlanListItemDto, GetMultiDayPlansResponseDto } from "../../types";
import { multiDayPlansApi } from "../../lib/api/multi-day-plans.client";

type SortField = "created_at" | "updated_at" | "name";
type SortOrder = "asc" | "desc";

interface UseMultiDayPlansListReturn {
  plans: MultiDayPlanListItemDto[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  search: (query: string) => Promise<void>;
  setSort: (field: SortField, order: SortOrder) => Promise<void>;
}

/**
 * Custom hook that manages multi-day meal plans list state and API interactions.
 * Encapsulates API calls, loading states, and error handling.
 *
 * @returns Object containing multi-day plans state and helper functions
 */
export function useMultiDayPlansList(): UseMultiDayPlansListReturn {
  const [plans, setPlans] = useState<MultiDayPlanListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSearch, setCurrentSearch] = useState<string>("");
  const [currentSort, setCurrentSort] = useState<SortField>("updated_at");
  const [currentOrder, setCurrentOrder] = useState<SortOrder>("desc");

  const fetchPlans = useCallback(
    async (search?: string, sort: SortField = currentSort, order: SortOrder = currentOrder) => {
      setIsLoading(true);
      setError(null);

      try {
        const data: GetMultiDayPlansResponseDto = await multiDayPlansApi.getAll(
          search?.trim() || undefined,
          sort,
          order
        );
        setPlans(data);
        setCurrentSearch(search || "");
        setCurrentSort(sort);
        setCurrentOrder(order);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred. Please try again.";
        setError(errorMessage);
        // eslint-disable-next-line no-console
        console.error("Error fetching multi-day plans:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [currentSort, currentOrder]
  );

  const refetch = useCallback(async () => {
    await fetchPlans(currentSearch, currentSort, currentOrder);
  }, [fetchPlans, currentSearch, currentSort, currentOrder]);

  const search = useCallback(
    async (query: string) => {
      await fetchPlans(query, currentSort, currentOrder);
    },
    [fetchPlans, currentSort, currentOrder]
  );

  const setSort = useCallback(
    async (field: SortField, order: SortOrder) => {
      await fetchPlans(currentSearch, field, order);
    },
    [fetchPlans, currentSearch]
  );

  return {
    plans,
    isLoading,
    error,
    refetch,
    search,
    setSort,
  };
}
