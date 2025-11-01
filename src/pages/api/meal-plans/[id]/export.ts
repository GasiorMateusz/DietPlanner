import type { APIRoute } from "astro";
import { DatabaseError, NotFoundError } from "../../../../lib/errors.ts";
import { MealPlanService } from "../../../../lib/meal-plans/meal-plan.service.ts";
import { DocumentGeneratorService } from "../../../../lib/meal-plans/doc-generator.service.ts";
import { mealPlanIdPathParamSchema } from "../../../../lib/validation/meal-plans.schemas.ts";

export const prerender = false;

/**
 * GET /api/meal-plans/{id}/export
 *
 * Generates a Microsoft Word document (.doc) containing the specified meal plan details.
 * Returns the document as a downloadable binary file.
 *
 * Path Parameters:
 * - id (required): UUID of the meal plan to export
 *
 * @returns 200 OK with binary .doc file
 * @returns 400 Bad Request if ID is not a valid UUID
 * @returns 401 Unauthorized if authentication fails
 * @returns 404 Not Found if meal plan doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error for database failures or document generation failures
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const supabase = locals.supabase;

    // TEMPORARY: Authentication disabled
    // const {
    //   data: { user },
    //   error: authError,
    // } = await supabase.auth.getUser();

    // if (authError || !user) {
    //   return new Response(
    //     JSON.stringify({
    //       error: 'Unauthorized',
    //       details: 'Authentication required',
    //     }),
    //     {
    //       status: 401,
    //       headers: { 'Content-Type': 'application/json' },
    //     }
    //   );
    // }

    // TEMPORARY: Use hardcoded user ID
    const placeholderUserId = "558ff210-94c6-4d54-8cf6-bdd5c345a984";

    // Validate path parameters
    const paramValidation = mealPlanIdPathParamSchema.safeParse(params);
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

    // Fetch meal plan from database
    const mealPlan = await MealPlanService.getMealPlanById(paramValidation.data.id, placeholderUserId, supabase);

    // Generate Word document
    const docBuffer = await DocumentGeneratorService.generateDoc(mealPlan);

    // Sanitize filename
    const sanitizedFilename = DocumentGeneratorService.sanitizeFilename(mealPlan.name);
    const filename = `${sanitizedFilename}.doc`;

    // Return binary response with appropriate headers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Response(docBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/msword",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": docBuffer.length.toString(),
      },
    });
  } catch (error) {
    // Handle custom errors
    if (error instanceof NotFoundError) {
      return new Response(
        JSON.stringify({
          error: "Meal plan not found",
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

    // Handle unexpected errors (document generation failures, etc.)
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
