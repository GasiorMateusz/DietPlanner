import { useState, useEffect, useRef, useCallback } from "react";
import { getAuthHeaders, handleApiResponse } from "@/lib/api/base.client";
import { useMealPlansList } from "./hooks/useMealPlansList";
import { useDebounce } from "./hooks/useDebounce";
import { DashboardHeader } from "./DashboardHeader";
import { MealPlanList } from "./MealPlanList";
import { StartupFormDialog } from "./StartupFormDialog";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { ExportOptionsModal } from "./ExportOptionsModal";
import type { MealPlanStartupData } from "../types";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * Main Dashboard component that displays and manages meal plans.
 * Orchestrates the meal plans list, handles API interactions, and manages dialog visibility.
 */
export default function DashboardView() {
  const { t } = useTranslation();
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
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [selectedMealPlanId, setSelectedMealPlanId] = useState<string | null>(null);
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
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  /**
   * Handles create button click - opens startup form dialog.
   */
  const handleCreateClick = useCallback(() => {
    setIsStartupDialogOpen(true);
  }, []);

  /**
   * Handles edit/view button click - navigates to editor.
   */
  const handleEdit = useCallback((id: string) => {
    window.location.href = `/app/editor/${id}`;
  }, []);

  /**
   * Handles export link click - opens export options modal.
   */
  const handleExport = useCallback((id: string) => {
    setSelectedMealPlanId(id);
    setIsExportModalOpen(true);
  }, []);

  /**
   * Handles delete button click - opens confirmation dialog.
   */
  const handleDelete = useCallback((id: string, name: string) => {
    setDeleteDialogState({
      isOpen: true,
      mealPlanId: id,
      mealPlanName: name,
    });
  }, []);

  /**
   * Handles delete confirmation - deletes meal plan and refreshes list.
   */
  const handleDeleteConfirm = useCallback(
    async (id: string) => {
      setIsDeleting(true);
      setDeleteError(null);

      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/meal-plans/${id}`, {
          method: "DELETE",
          headers,
        });

        await handleApiResponse(response);

        // Close dialog and refresh list
        setDeleteDialogState({
          isOpen: false,
          mealPlanId: null,
          mealPlanName: null,
        });
        await refetch();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred. Please try again.";
        setDeleteError(errorMessage);
      } finally {
        setIsDeleting(false);
      }
    },
    [refetch]
  );

  /**
   * Handles startup form submission - navigates to create page.
   */
  const handleStartupFormSubmit = useCallback((data: MealPlanStartupData) => {
    // Store startup data in sessionStorage (read by AIChatInterface to initiate AI session)
    sessionStorage.setItem("mealPlanStartupData", JSON.stringify(data));
    setIsStartupDialogOpen(false);
    window.location.href = "/app/create";
  }, []);

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <h1 className="text-3xl font-bold mb-6" data-testid="dashboard-heading">
        {t("dashboard.title")}
      </h1>

      <DashboardHeader
        onCreateClick={handleCreateClick}
        onSearchChange={handleSearchChange}
        searchValue={searchQuery}
      />

      {/* Delete error message */}
      {deleteError && <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">{deleteError}</div>}

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

      {/* Export Options Modal */}
      {selectedMealPlanId && (
        <ExportOptionsModal
          isOpen={isExportModalOpen}
          mealPlanId={selectedMealPlanId}
          onClose={() => {
            setIsExportModalOpen(false);
            setSelectedMealPlanId(null);
          }}
        />
      )}
    </div>
  );
}
