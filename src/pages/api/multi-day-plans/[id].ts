import type { APIRoute } from "astro";
import { DatabaseError, NotFoundError, UnauthorizedError, ValidationError } from "../../../lib/errors.ts";
import * as MultiDayPlanService from "../../../lib/multi-day-plans/multi-day-plan.service.ts";
import { multiDayPlanIdParamSchema, updateMultiDayPlanSchema } from "../../../lib/validation/meal-plans.schemas.ts";
import type { UpdateMultiDayPlanCommand } from "../../../types.ts";
import { getUserFromRequest } from "@/lib/auth/session.service.js";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const { params, locals } = context;
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

    const plan = await MultiDayPlanService.getMultiDayPlanById(paramValidation.data.id, user.id, supabase);

    return new Response(JSON.stringify(plan), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return new Response(
        JSON.stringify({
          error: "Multi-day plan not found",
          details: error.message,
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

export const PUT: APIRoute = async (context) => {
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

    const bodyValidation = updateMultiDayPlanSchema.safeParse(body);
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

    const command = bodyValidation.data as UpdateMultiDayPlanCommand;

    // Debug: Log received update command
    // eslint-disable-next-line no-console
    console.log("[PUT /api/multi-day-plans/:id] Received update command:", {
      plan_id: paramValidation.data.id,
      has_day_plans: command.day_plans !== undefined,
      day_plans_count: command.day_plans?.length || 0,
      day_plans_day_numbers: command.day_plans?.map((d) => d.day_number) || [],
      user_id: user.id,
    });

    const plan = await MultiDayPlanService.updateMultiDayPlan(paramValidation.data.id, command, user.id, supabase);

    return new Response(JSON.stringify(plan), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return new Response(
        JSON.stringify({
          error: "Multi-day plan not found",
          details: error.message,
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

export const DELETE: APIRoute = async (context) => {
  try {
    const { params, locals } = context;
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

    await MultiDayPlanService.deleteMultiDayPlan(paramValidation.data.id, user.id, supabase);

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return new Response(
        JSON.stringify({
          error: "Multi-day plan not found",
          details: error.message,
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
