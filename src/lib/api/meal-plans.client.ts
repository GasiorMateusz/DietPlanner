import type {
  GetMealPlansResponseDto,
  GetMealPlanByIdResponseDto,
  CreateMealPlanCommand,
  CreateMealPlanResponseDto,
  UpdateMealPlanCommand,
  UpdateMealPlanResponseDto,
  ExportOptions,
} from "@/types";
import { getAuthHeaders, getAuthHeadersWithoutContentType, handleApiResponse } from "./base.client";

/**
 * API client for meal plan operations.
 */
export const mealPlansApi = {
  /**
   * Gets all meal plans with optional search and sorting.
   * @param search - Optional search query
   * @param sort - Sort field (default: "created_at")
   * @param order - Sort order (default: "desc")
   * @returns Array of meal plan list items
   */
  async getAll(search?: string, sort = "created_at", order: "asc" | "desc" = "desc"): Promise<GetMealPlansResponseDto> {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams();
    if (search && search.trim()) {
      params.append("search", search.trim());
    }
    params.append("sort", sort);
    params.append("order", order);

    const response = await fetch(`/api/meal-plans?${params.toString()}`, {
      headers,
    });

    return handleApiResponse<GetMealPlansResponseDto>(response);
  },

  /**
   * Gets a single meal plan by ID.
   * @param id - Meal plan ID
   * @returns Complete meal plan data
   */
  async getById(id: string): Promise<GetMealPlanByIdResponseDto> {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/meal-plans/${id}`, {
      headers,
    });

    return handleApiResponse<GetMealPlanByIdResponseDto>(response);
  },

  /**
   * Creates a new meal plan.
   * @param command - Meal plan creation data
   * @returns Created meal plan data
   */
  async create(command: CreateMealPlanCommand): Promise<CreateMealPlanResponseDto> {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/meal-plans", {
      method: "POST",
      headers,
      body: JSON.stringify(command),
    });

    return handleApiResponse<CreateMealPlanResponseDto>(response);
  },

  /**
   * Updates an existing meal plan.
   * @param id - Meal plan ID
   * @param command - Meal plan update data
   * @returns Updated meal plan data
   */
  async update(id: string, command: UpdateMealPlanCommand): Promise<UpdateMealPlanResponseDto> {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/meal-plans/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(command),
    });

    return handleApiResponse<UpdateMealPlanResponseDto>(response);
  },

  /**
   * Deletes a meal plan.
   * @param id - Meal plan ID
   */
  async delete(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/meal-plans/${id}`, {
      method: "DELETE",
      headers,
    });

    await handleApiResponse<undefined>(response);
  },

  /**
   * Exports a meal plan with specified options.
   * @param id - Meal plan ID
   * @param options - Export options (content and format)
   * @returns Object containing the blob and filename extracted from Content-Disposition header
   */
  async export(id: string, options: ExportOptions): Promise<{ blob: Blob; filename: string }> {
    const headers = await getAuthHeadersWithoutContentType();
    const queryParams = new URLSearchParams({
      dailySummary: options.content.dailySummary.toString(),
      mealsSummary: options.content.mealsSummary.toString(),
      ingredients: options.content.ingredients.toString(),
      preparation: options.content.preparation.toString(),
      format: options.format,
    });

    const response = await fetch(`/api/meal-plans/${id}/export?${queryParams.toString()}`, {
      headers,
    });

    if (response.status === 401) {
      window.location.href = "/auth/login";
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Failed to download file",
      }));
      throw new Error(errorData.error || "Failed to download file");
    }

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers.get("Content-Disposition");
    const extension = options.format === "doc" ? "doc" : "html";
    let filename = `meal-plan-${id}.${extension}`; // fallback

    if (contentDisposition) {
      // Match filename="..." or filename=... (handles quoted and unquoted values)
      // RFC 5987 format: filename*=UTF-8''... is also supported
      const filenameMatch =
        contentDisposition.match(/filename\*=UTF-8''(.+?)(?:;|$)/i) ||
        contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);

      if (filenameMatch && filenameMatch[1]) {
        // Decode URI-encoded filename (for RFC 5987 format) or remove quotes
        try {
          filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ""));
        } catch {
          // If decoding fails, just remove quotes
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }
    }

    const blob = await response.blob();
    return { blob, filename };
  },
};
