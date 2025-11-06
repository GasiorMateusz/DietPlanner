import type { APIRoute } from "astro";
import { DatabaseError, NotFoundError } from "../../../lib/errors.ts";
import * as MealPlanService from "../../../lib/meal-plans/meal-plan.service.ts";
import { mealPlanIdParamSchema, updateMealPlanSchema } from "../../../lib/validation/meal-plans.schemas.ts";
import type { UpdateMealPlanCommand } from "../../../types.ts";
import { getUserFromRequest } from "@/lib/auth/session.service.js";

export const prerender = false;

/**
 * GET /api/meal-plans/{id}
 *
 * Retrieves a single meal plan by ID.
 *
 * Path Parameters:
 * - id (required): UUID of the meal plan
 *
 * @returns 200 OK with the complete meal plan row
 * @returns 400 Bad Request if ID is not a valid UUID
 * @returns 401 Unauthorized if authentication fails
 * @returns 404 Not Found if meal plan doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error for database failures
 */
export const GET: APIRoute = async (context) => {
  try {
    const { params, locals } = context;
    const supabase = locals.supabase;
    const user = await getUserFromRequest(context);

    // Validate path parameters
    const paramValidation = mealPlanIdParamSchema.safeParse(params);
    if (!paramValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: paramValidation.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Call service to get meal plan
    const mealPlan = await MealPlanService.getMealPlanById(paramValidation.data.id, user.id, supabase);

    return new Response(JSON.stringify(mealPlan), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle custom errors
    if (error instanceof NotFoundError) {
      return new Response(
        JSON.stringify({
          error: "Meal plan not found",
          details: error.message,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof DatabaseError) {
      // eslint-disable-next-line no-console
      console.error("Database error:", error.message, error.originalError);
      return new Response(
        JSON.stringify({
          error: "An internal error occurred",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Internal server error:", error);
    return new Response(
      JSON.stringify({
        error: "An internal error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * PUT /api/meal-plans/{id}
 *
 * Updates an existing meal plan. Supports partial updates.
 *
 * Path Parameters:
 * - id (required): UUID of the meal plan
 *
 * Request Body: UpdateMealPlanCommand (all fields optional)
 *
 * @returns 200 OK with the updated meal plan row
 * @returns 400 Bad Request if request body or path parameters fail validation
 * @returns 401 Unauthorized if authentication fails
 * @returns 404 Not Found if meal plan doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error for database failures
 */
export const PUT: APIRoute = async (context) => {
  try {
    const { params, request, locals } = context;
    const supabase = locals.supabase;
    const user = await getUserFromRequest(context);

    // Validate path parameters
    const paramValidation = mealPlanIdParamSchema.safeParse(params);
    if (!paramValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: paramValidation.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate request body
    const bodyValidation = updateMealPlanSchema.safeParse(body);
    if (!bodyValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: bodyValidation.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Call service to update meal plan
    const mealPlan = await MealPlanService.updateMealPlan(
      paramValidation.data.id,
      bodyValidation.data as UpdateMealPlanCommand,
      user.id,
      supabase
    );

    return new Response(JSON.stringify(mealPlan), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle custom errors
    if (error instanceof NotFoundError) {
      return new Response(
        JSON.stringify({
          error: "Meal plan not found",
          details: error.message,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof DatabaseError) {
      // eslint-disable-next-line no-console
      console.error("Database error:", error.message, error.originalError);
      return new Response(
        JSON.stringify({
          error: "An internal error occurred",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Internal server error:", error);
    return new Response(
      JSON.stringify({
        error: "An internal error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * DELETE /api/meal-plans/{id}
 *
 * Deletes a meal plan.
 *
 * Path Parameters:
 * - id (required): UUID of the meal plan
 *
 * @returns 204 No Content on successful deletion
 * @returns 400 Bad Request if ID is not a valid UUID
 * @returns 401 Unauthorized if authentication fails
 * @returns 404 Not Found if meal plan doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error for database failures
 */
export const DELETE: APIRoute = async (context) => {
  try {
    const { params, locals } = context;
    const supabase = locals.supabase;
    const user = await getUserFromRequest(context);

    // Validate path parameters
    const paramValidation = mealPlanIdParamSchema.safeParse(params);
    if (!paramValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: paramValidation.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Call service to delete meal plan
    await MealPlanService.deleteMealPlan(paramValidation.data.id, user.id, supabase);

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle custom errors
    if (error instanceof NotFoundError) {
      return new Response(
        JSON.stringify({
          error: "Meal plan not found",
          details: error.message,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof DatabaseError) {
      // eslint-disable-next-line no-console
      console.error("Database error:", error.message, error.originalError);
      return new Response(
        JSON.stringify({
          error: "An internal error occurred",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Internal server error:", error);
    return new Response(
      JSON.stringify({
        error: "An internal error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
