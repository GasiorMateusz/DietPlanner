import type { APIRoute } from "astro";
import { DatabaseError, NotFoundError } from "../../../../lib/errors.ts";
import * as MealPlanService from "../../../../lib/meal-plans/meal-plan.service.ts";
import * as DocumentGeneratorService from "../../../../lib/meal-plans/doc-generator.service.ts";
import { HtmlGeneratorService } from "../../../../lib/meal-plans/html-generator.service.ts";
import { mealPlanIdPathParamSchema, exportMealPlanQuerySchema } from "../../../../lib/validation/meal-plans.schemas.ts";
import { getUserFromRequest } from "@/lib/auth/session.service.js";
import * as UserPreferenceService from "../../../../lib/user-preferences/user-preference.service.ts";
import type { ExportContentOptions } from "../../../../types.ts";

export const prerender = false;

/**
 * GET /api/meal-plans/{id}/export
 *
 * Generates a document (DOC or HTML) containing the specified meal plan details with customizable content options.
 * Returns the document as a downloadable file.
 *
 * Path Parameters:
 * - id (required): UUID of the meal plan to export
 *
 * Query Parameters:
 * - dailySummary (optional): "true" | "false" (default: "true")
 * - mealsSummary (optional): "true" | "false" (default: "true")
 * - ingredients (optional): "true" | "false" (default: "true")
 * - preparation (optional): "true" | "false" (default: "true")
 * - format (required): "doc" | "html"
 *
 * @returns 200 OK with binary file (DOC or HTML)
 * @returns 400 Bad Request if validation fails or no content options selected
 * @returns 401 Unauthorized if authentication fails
 * @returns 404 Not Found if meal plan doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error for database failures or document generation failures
 */
export const GET: APIRoute = async (context) => {
  try {
    const { params, request, locals } = context;
    const supabase = locals.supabase;
    const user = await getUserFromRequest(context);

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

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      dailySummary: url.searchParams.get("dailySummary") ?? undefined,
      mealsSummary: url.searchParams.get("mealsSummary") ?? undefined,
      ingredients: url.searchParams.get("ingredients") ?? undefined,
      preparation: url.searchParams.get("preparation") ?? undefined,
      format: url.searchParams.get("format") ?? undefined,
    };

    const queryValidation = exportMealPlanQuerySchema.safeParse(queryParams);
    if (!queryValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: queryValidation.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Convert string booleans to actual booleans
    const contentOptions: ExportContentOptions = {
      dailySummary: queryValidation.data.dailySummary === "true",
      mealsSummary: queryValidation.data.mealsSummary === "true",
      ingredients: queryValidation.data.ingredients === "true",
      preparation: queryValidation.data.preparation === "true",
    };

    // Validate that at least one content option is enabled
    if (
      !contentOptions.dailySummary &&
      !contentOptions.mealsSummary &&
      !contentOptions.ingredients &&
      !contentOptions.preparation
    ) {
      return new Response(
        JSON.stringify({
          error: "At least one content option must be selected",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch meal plan from database
    const mealPlan = await MealPlanService.getMealPlanById(paramValidation.data.id, user.id, supabase);

    // Fetch user language preference
    const languagePreference = await UserPreferenceService.getUserLanguagePreference(user.id, supabase);
    const language = languagePreference.language;

    // Sanitize filename
    const sanitizedFilename = DocumentGeneratorService.sanitizeFilename(mealPlan.name);
    const format = queryValidation.data.format;

    // Generate document based on format
    if (format === "html") {
      try {
        const htmlGenerator = new HtmlGeneratorService();
        const htmlContent = htmlGenerator.generateHtml(mealPlan, contentOptions, language);
        const filename = `${sanitizedFilename}.html`;

        return new Response(htmlContent, {
          status: 200,
          headers: {
            "Content-Type": "text/html",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Length": Buffer.byteLength(htmlContent, "utf8").toString(),
          },
        });
      } catch (htmlError) {
        // eslint-disable-next-line no-console
        console.error("HTML generation error:", {
          error: htmlError,
          message: htmlError instanceof Error ? htmlError.message : String(htmlError),
          stack: htmlError instanceof Error ? htmlError.stack : undefined,
          mealPlanId: paramValidation.data.id,
          contentOptions,
          language,
        });
        throw htmlError;
      }
    } else {
      // DOC format
      try {
        const docBuffer = await DocumentGeneratorService.generateDoc(mealPlan, contentOptions, language);
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
      } catch (docError) {
        // eslint-disable-next-line no-console
        console.error("DOC generation error:", docError);
        throw docError;
      }
    }
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
    console.error("Internal server error in export endpoint:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
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
