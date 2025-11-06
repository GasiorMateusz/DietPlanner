import type { APIRoute } from "astro";
import { DatabaseError, UnauthorizedError, ValidationError } from "../../../lib/errors.ts";
import * as MealPlanService from "../../../lib/meal-plans/meal-plan.service.ts";
import { createMealPlanSchema, listMealPlansQuerySchema } from "../../../lib/validation/meal-plans.schemas.ts";
import type { CreateMealPlanCommand } from "../../../types.ts";
import { getUserFromRequest } from "@/lib/auth/session.service.js";

export const prerender = false;

/**
 * GET /api/meal-plans
 *
 * Lists all meal plans for the authenticated user with optional search and sorting.
 *
 * Query Parameters:
 * - search (optional): Case-insensitive partial match on meal plan name
 * - sort (optional): Field to sort by ('created_at', 'updated_at', 'name'). Default: 'updated_at'
 * - order (optional): Sort order ('asc', 'desc'). Default: 'desc'
 *
 * @returns 200 OK with array of meal plan list items
 * @returns 400 Bad Request if query parameters fail validation
 * @returns 401 Unauthorized if authentication fails
 * @returns 500 Internal Server Error for database failures
 */
export const GET: APIRoute = async (context) => {
  try {
    const { request, locals } = context;
    const supabase = locals.supabase;
    const user = await getUserFromRequest(context);

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      search: url.searchParams.get("search") ?? undefined,
      sort: url.searchParams.get("sort") ?? undefined,
      order: url.searchParams.get("order") ?? undefined,
    };

    const validation = listMealPlansQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validation.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Call service to list meal plans
    const mealPlans = await MealPlanService.listMealPlans(user.id, validation.data, supabase);

    return new Response(JSON.stringify(mealPlans), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          details: error.data.details,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    // Handle custom errors
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          details: error.details,
        }),
        {
          status: 400,
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
 * POST /api/meal-plans
 *
 * Creates a new meal plan for the authenticated user.
 *
 * Request Body: CreateMealPlanCommand
 * - name (required): Name of the meal plan
 * - source_chat_session_id (optional): ID of the AI chat session that generated this plan
 * - plan_content (required): Complete meal plan JSON structure
 * - startup_data (required): Patient information and targets
 *
 * @returns 201 Created with the complete meal plan row
 * @returns 400 Bad Request if request body fails validation
 * @returns 401 Unauthorized if authentication fails
 * @returns 500 Internal Server Error for database failures
 */
export const POST: APIRoute = async (context) => {
  try {
    const { request, locals } = context;
    const supabase = locals.supabase;
    const user = await getUserFromRequest(context);

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
    const validation = createMealPlanSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validation.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Call service to create meal plan
    const mealPlan = await MealPlanService.createMealPlan(validation.data as CreateMealPlanCommand, user.id, supabase);

    return new Response(JSON.stringify(mealPlan), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          details: error.data.details,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    // Handle custom errors
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          details: error.details,
        }),
        {
          status: 400,
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
