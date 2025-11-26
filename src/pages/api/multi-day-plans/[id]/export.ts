import type { APIRoute } from "astro";
import { DatabaseError, NotFoundError, UnauthorizedError } from "../../../../lib/errors.ts";
import * as MultiDayPlanService from "../../../../lib/multi-day-plans/multi-day-plan.service.ts";
import * as DocumentGeneratorService from "../../../../lib/meal-plans/doc-generator.service.ts";
import { HtmlGeneratorService } from "../../../../lib/meal-plans/html-generator.service.ts";
import {
  multiDayPlanIdParamSchema,
  exportMultiDayPlanQuerySchema,
} from "../../../../lib/validation/meal-plans.schemas.ts";
import { getUserFromRequest } from "@/lib/auth/session.service.js";
import * as UserPreferenceService from "../../../../lib/user-preferences/user-preference.service.ts";
import type { ExportContentOptions } from "../../../../types.ts";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const { params, request, locals } = context;
    const supabase = locals.supabase;
    const user = await getUserFromRequest(context);

    const paramValidation = multiDayPlanIdParamSchema.safeParse(params);
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

    const url = new URL(request.url);
    const queryParams = {
      dailySummary: url.searchParams.get("dailySummary") ?? undefined,
      mealsSummary: url.searchParams.get("mealsSummary") ?? undefined,
      ingredients: url.searchParams.get("ingredients") ?? undefined,
      preparation: url.searchParams.get("preparation") ?? undefined,
      format: url.searchParams.get("format") ?? undefined,
    };

    const queryValidation = exportMultiDayPlanQuerySchema.safeParse(queryParams);
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

    const contentOptions: ExportContentOptions = {
      dailySummary: queryValidation.data.dailySummary === "true",
      mealsSummary: queryValidation.data.mealsSummary === "true",
      ingredients: queryValidation.data.ingredients === "true",
      preparation: queryValidation.data.preparation === "true",
    };

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

    const multiDayPlan = await MultiDayPlanService.getMultiDayPlanById(paramValidation.data.id, user.id, supabase);

    const languagePreference = await UserPreferenceService.getUserLanguagePreference(user.id, supabase);
    const language = languagePreference.language;

    const sanitizedFilename = DocumentGeneratorService.sanitizeFilename(multiDayPlan.name);
    const format = queryValidation.data.format;

    if (format === "html") {
      const htmlGenerator = new HtmlGeneratorService();
      let htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${multiDayPlan.name}</title></head><body>`;
      htmlContent += `<h1>${multiDayPlan.name}</h1>`;
      htmlContent += `<p><strong>Number of Days:</strong> ${multiDayPlan.number_of_days}</p>`;

      if (multiDayPlan.common_exclusions_guidelines) {
        htmlContent += `<h2>Common Guidelines</h2><p>${multiDayPlan.common_exclusions_guidelines}</p>`;
      }

      for (const day of multiDayPlan.days.sort((a, b) => a.day_number - b.day_number)) {
        htmlContent += `<h2>Day ${day.day_number}${day.day_plan.name ? `: ${day.day_plan.name}` : ""}</h2>`;
        htmlContent += htmlGenerator.generateHtml(day.day_plan, contentOptions, language);
      }

      htmlContent += "</body></html>";
      const filename = `${sanitizedFilename}.html`;

      return new Response(htmlContent, {
        status: 200,
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": Buffer.byteLength(htmlContent, "utf8").toString(),
        },
      });
    } else {
      const docBuffer = await DocumentGeneratorService.generateMultiDayDoc(multiDayPlan, contentOptions, language);
      const filename = `${sanitizedFilename}.doc`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new Response(docBuffer as any, {
        status: 200,
        headers: {
          "Content-Type": "application/msword",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": docBuffer.length.toString(),
        },
      });
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      return new Response(
        JSON.stringify({
          error: "Multi-day plan not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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

    // eslint-disable-next-line no-console
    console.error("Internal server error in export endpoint:", error);
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
