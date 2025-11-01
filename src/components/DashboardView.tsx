import { useState, useEffect, useRef } from "react";
import { getAuthToken } from "../lib/auth/get-auth-token";
import { useMealPlansList } from "./hooks/useMealPlansList";
import { useDebounce } from "./hooks/useDebounce";
import { DashboardHeader } from "./DashboardHeader";
import { MealPlanList } from "./MealPlanList";
import { StartupFormDialog } from "./StartupFormDialog";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import type { MealPlanStartupData } from "../types";

/**
 * Main Dashboard component that displays and manages meal plans.
 * Orchestrates the meal plans list, handles API interactions, and manages dialog visibility.
 */
export default function DashboardView() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isStartupDialogOpen, setIsStartupDialogOpen] = useState<boolean>(false);
  const [deleteDialogState, setDeleteDialogState] = useState<{
    isOpen: boolean;
    mealPlanId: string | null;
    mealPlanName: string | null;
  }>({
    isOpen: false,
    mealPlanId: null,
    mealPlanName: null,
  });
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const hasInitiallyFetched = useRef<boolean>(false);

  // Use custom hook for meal plans list management
  const { mealPlans, isLoading, error, refetch, search } = useMealPlansList();

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch meal plans on component mount (only once)
  useEffect(() => {
    if (!hasInitiallyFetched.current) {
      hasInitiallyFetched.current = true;
      refetch();
    }
  }, [refetch]);

  // Trigger search when debounced query changes (skip initial mount)
  useEffect(() => {
    if (hasInitiallyFetched.current) {
      search(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, search]);

  /**
   * Handles search input changes.
   * The actual API call will be triggered by the debounced effect.
   */
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  /**
   * Handles create button click - opens startup form dialog.
   */
  const handleCreateClick = () => {
    setIsStartupDialogOpen(true);
  };

  /**
   * Handles edit/view button click - navigates to editor.
   */
  const handleEdit = (id: string) => {
    window.location.href = `/app/editor/${id}`;
  };

  /**
   * Handles export link click - opens export endpoint.
   */
  const handleExport = (id: string) => {
    window.open(`/api/meal-plans/${id}/export`, '_blank');
  };

  /**
   * Handles delete button click - opens confirmation dialog.
   */
  const handleDelete = (id: string, name: string) => {
    setDeleteDialogState({
      isOpen: true,
      mealPlanId: id,
      mealPlanName: name,
    });
  };

  /**
   * Handles delete confirmation - deletes meal plan and refreshes list.
   */
  const handleDeleteConfirm = async (id: string) => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(`/api/meal-plans/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Failed to delete meal plan",
        }));
        throw new Error(errorData.error || "Failed to delete meal plan");
      }

      // Close dialog and refresh list
      setDeleteDialogState({
        isOpen: false,
        mealPlanId: null,
        mealPlanName: null,
      });
      await refetch();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred. Please try again.";
      setDeleteError(errorMessage);
      console.error("Error deleting meal plan:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Handles startup form submission - navigates to create page.
   */
  const handleStartupFormSubmit = (data: MealPlanStartupData) => {
    // Store startup data in sessionStorage to pass to create page
    // The create page will read this and use it to initiate the AI session
    sessionStorage.setItem("mealPlanStartupData", JSON.stringify(data));
    setIsStartupDialogOpen(false);
    // Navigate to create page
    window.location.href = "/app/create";
  };

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <h1 className="text-3xl font-bold mb-6">Meal Plans Dashboard</h1>

      <DashboardHeader
        onCreateClick={handleCreateClick}
        onSearchChange={handleSearchChange}
        searchValue={searchQuery}
      />

      {/* Delete error message */}
      {deleteError && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
          {deleteError}
        </div>
      )}

      {/* Meal Plans List */}
      <MealPlanList
        mealPlans={mealPlans}
        isLoading={isLoading}
        error={error}
        onEdit={handleEdit}
        onExport={handleExport}
        onDelete={handleDelete}
        onCreateClick={handleCreateClick}
      />

      {/* Dialogs */}
      <StartupFormDialog
        open={isStartupDialogOpen}
        onClose={() => setIsStartupDialogOpen(false)}
        onSubmit={handleStartupFormSubmit}
      />

      <DeleteConfirmationDialog
        open={deleteDialogState.isOpen}
        mealPlanId={deleteDialogState.mealPlanId}
        mealPlanName={deleteDialogState.mealPlanName ?? undefined}
        onClose={() =>
          setDeleteDialogState({
            isOpen: false,
            mealPlanId: null,
            mealPlanName: null,
          })
        }
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
