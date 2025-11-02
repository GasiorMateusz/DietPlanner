import { useState, useCallback } from "react";
import type { GetMealPlansResponseDto, MealPlanListItemDto } from "../../types";
import { getAuthToken } from "../../lib/auth/get-auth-token";

type SortField = "created_at" | "updated_at" | "name";
type SortOrder = "asc" | "desc";

interface UseMealPlansListReturn {
  mealPlans: MealPlanListItemDto[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  search: (query: string) => Promise<void>;
  setSort: (field: SortField, order: SortOrder) => Promise<void>;
}

/**
 * Custom hook that manages meal plans list state and API interactions.
 * Encapsulates API calls, loading states, and error handling.
 *
 * @returns Object containing meal plans state and helper functions
 */
export function useMealPlansList(): UseMealPlansListReturn {
  const [mealPlans, setMealPlans] = useState<MealPlanListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSearch, setCurrentSearch] = useState<string>("");
  const [currentSort, setCurrentSort] = useState<SortField>("updated_at");
  const [currentOrder, setCurrentOrder] = useState<SortOrder>("desc");

  const fetchMealPlans = useCallback(
    async (
      search?: string,
      sort: SortField = currentSort,
      order: SortOrder = currentOrder
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const token = await getAuthToken();
        if (!token) {
          window.location.href = "/auth/login";
          return;
        }

        const params = new URLSearchParams();
        if (search && search.trim()) {
          params.append("search", search.trim());
        }
        params.append("sort", sort);
        params.append("order", order);

        const response = await fetch(`/api/meal-plans?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401) {
          window.location.href = "/auth/login";
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: "An internal error occurred",
          }));
          throw new Error(errorData.error || "An internal error occurred");
        }

        const data: GetMealPlansResponseDto = await response.json();
        setMealPlans(data);
        setCurrentSearch(search || "");
        setCurrentSort(sort);
        setCurrentOrder(order);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An error occurred. Please try again.";
        setError(errorMessage);
        console.error("Error fetching meal plans:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [currentSort, currentOrder]
  );

  const refetch = useCallback(async () => {
    await fetchMealPlans(currentSearch, currentSort, currentOrder);
  }, [fetchMealPlans, currentSearch, currentSort, currentOrder]);

  const search = useCallback(
    async (query: string) => {
      await fetchMealPlans(query, currentSort, currentOrder);
    },
    [fetchMealPlans, currentSort, currentOrder]
  );

  const setSort = useCallback(
    async (field: SortField, order: SortOrder) => {
      await fetchMealPlans(currentSearch, field, order);
    },
    [fetchMealPlans, currentSearch]
  );

  return {
    mealPlans,
    isLoading,
    error,
    refetch,
    search,
    setSort,
  };
}
