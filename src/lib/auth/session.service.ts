import { UnauthorizedError } from "@/lib/errors";
import type { APIContext } from "astro";

export async function getUserFromRequest(context: APIContext) {
  const supabase = context.locals.supabase;
  const authHeader = context.request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError({
      message: "Authorization header is missing or malformed.",
      details: "No active session found. Please log in and try again.",
    });
  }

  const token = authHeader.split(" ")[1];

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new UnauthorizedError({
      message: "You must be logged in to access this resource.",
      details: "Invalid session token. Please log in again.",
    });
  }

  return user;
}
