import type {
  GetMealPlansResponseDto,
  GetMealPlanByIdResponseDto,
  CreateMealPlanCommand,
  CreateMealPlanResponseDto,
  UpdateMealPlanCommand,
  UpdateMealPlanResponseDto,
} from "@/types";
import {
  getAuthHeaders,
  getAuthHeadersWithoutContentType,
  handleApiResponse,
  handleApiBlobResponse,
} from "./base.client";

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
   * Exports a meal plan as a Word document.
   * @param id - Meal plan ID
   * @returns Blob containing the exported document
   */
  async export(id: string): Promise<Blob> {
    const headers = await getAuthHeadersWithoutContentType();
    const response = await fetch(`/api/meal-plans/${id}/export`, {
      headers,
    });

    return handleApiBlobResponse(response);
  },
};
