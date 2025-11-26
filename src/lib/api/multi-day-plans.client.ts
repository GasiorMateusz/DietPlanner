import type {
  CreateMultiDayPlanCommand,
  CreateMultiDayPlanResponseDto,
  GetMultiDayPlanByIdResponseDto,
  GetMultiDayPlansResponseDto,
  UpdateMultiDayPlanCommand,
  ExportOptions,
} from "@/types";
import { getAuthHeaders, getAuthHeadersWithoutContentType, handleApiResponse } from "./base.client";

/**
 * API client for multi-day meal plan operations.
 */
export const multiDayPlansApi = {
  /**
   * Gets all multi-day meal plans with optional search and sorting.
   * @param search - Optional search query
   * @param sort - Sort field (default: "updated_at")
   * @param order - Sort order (default: "desc")
   * @returns Array of multi-day plan list items
   */
  async getAll(
    search?: string,
    sort = "updated_at",
    order: "asc" | "desc" = "desc"
  ): Promise<GetMultiDayPlansResponseDto> {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams();
    if (search && search.trim()) {
      params.append("search", search.trim());
    }
    params.append("sort", sort);
    params.append("order", order);

    const response = await fetch(`/api/multi-day-plans?${params.toString()}`, {
      headers,
    });

    return handleApiResponse<GetMultiDayPlansResponseDto>(response);
  },

  /**
   * Gets a single multi-day meal plan by ID.
   * @param id - Multi-day plan ID
   * @returns Complete multi-day plan data with all days
   */
  async getById(id: string): Promise<GetMultiDayPlanByIdResponseDto> {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/multi-day-plans/${id}`, {
      headers,
    });

    return handleApiResponse<GetMultiDayPlanByIdResponseDto>(response);
  },

  /**
   * Creates a new multi-day meal plan.
   * @param command - Multi-day plan creation data
   * @returns Created multi-day plan data
   */
  async create(command: CreateMultiDayPlanCommand): Promise<CreateMultiDayPlanResponseDto> {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/multi-day-plans", {
      method: "POST",
      headers,
      body: JSON.stringify(command),
    });

    return handleApiResponse<CreateMultiDayPlanResponseDto>(response);
  },

  /**
   * Updates an existing multi-day meal plan.
   * @param id - Multi-day plan ID
   * @param command - Multi-day plan update data
   * @returns Updated multi-day plan data
   */
  async update(id: string, command: UpdateMultiDayPlanCommand): Promise<GetMultiDayPlanByIdResponseDto> {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/multi-day-plans/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(command),
    });

    return handleApiResponse<GetMultiDayPlanByIdResponseDto>(response);
  },

  /**
   * Deletes a multi-day meal plan.
   * @param id - Multi-day plan ID
   */
  async delete(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/multi-day-plans/${id}`, {
      method: "DELETE",
      headers,
    });

    await handleApiResponse<undefined>(response);
  },

  /**
   * Exports a multi-day meal plan with specified options.
   * @param id - Multi-day plan ID
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

    const response = await fetch(`/api/multi-day-plans/${id}/export?${queryParams.toString()}`, {
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
    const extension = options.format === "doc" ? "docx" : "html";
    let filename = `multi-day-plan-${id}.${extension}`; // fallback

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
