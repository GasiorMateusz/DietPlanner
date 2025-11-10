import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth.schemas";
import { supabaseClient as supabase } from "@/db/supabase.client";
import { getAuthRedirectUrl } from "@/lib/utils/get-app-url";

interface Props {
  className?: string;
}

export default function ForgotPasswordForm({ className }: Props) {
  const [values, setValues] = React.useState<ForgotPasswordInput>({ email: "" });
  const [errors, setErrors] = React.useState<Partial<Record<keyof ForgotPasswordInput, string>>>({});
  const [message, setMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const emailId = React.useId();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValues({ email: e.target.value });
  }

  function validate(input: ForgotPasswordInput) {
    const parsed = forgotPasswordSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof ForgotPasswordInput, string>> = {};
      for (const issue of parsed.error.issues) {
        const pathKey = issue.path[0] as keyof ForgotPasswordInput | undefined;
        if (pathKey && !fieldErrors[pathKey]) fieldErrors[pathKey] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }

  function getPasswordResetSuccessMessage(): string {
    // Check if using local Supabase (Inbucket) by checking the Supabase URL
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "";
    const isUsingLocalSupabase = supabaseUrl.includes("localhost") || supabaseUrl.includes("127.0.0.1");
    return isUsingLocalSupabase
      ? "If an account exists for this email, we sent a password reset link. Check Inbucket at http://127.0.0.1:54324 for local emails."
      : "If an account exists for this email, we sent a password reset link.";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!validate(values)) return;

    setIsSubmitting(true);

    // Get the full redirect URL for password reset
    // This ensures we always use the correct production URL, not localhost
    const redirectTo = getAuthRedirectUrl("/auth/reset-password");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo,
      });

      setIsSubmitting(false);

      // Check if we're in development mode to show more detailed errors
      const isLocalDev =
        import.meta.env.DEV ||
        (typeof window !== "undefined" &&
          (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"));

      // In development, show ALL errors to help debug
      // Also show errors if using cloud Supabase (not local)
      const isUsingCloudSupabase =
        !import.meta.env.PUBLIC_SUPABASE_URL?.includes("localhost") &&
        !import.meta.env.PUBLIC_SUPABASE_URL?.includes("127.0.0.1");

      if (error && (isLocalDev || isUsingCloudSupabase)) {
        const errorMessage = error.message || "";
        const errorCode = (error as { code?: string }).code;

        // Show error message - always show for cloud Supabase, or in dev mode
        setMessage(`Error: ${errorMessage}${errorCode ? ` (Code: ${errorCode})` : ""}.`);
        return;
      }

      // In production, always show success message regardless of error (security best practice)
      // This prevents email enumeration attacks
      setMessage(getPasswordResetSuccessMessage());
    } catch (error) {
      setIsSubmitting(false);
      // Ignore refresh token errors - they're unrelated to password reset
      if (error && typeof error === "object" && "code" in error && error.code === "refresh_token_not_found") {
        // Still show success message (security best practice)
        setMessage(getPasswordResetSuccessMessage());
        return;
      }
      // Still show success message (security best practice)
      setMessage(getPasswordResetSuccessMessage());
    }
  }

  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)} noValidate>
      {message ? (
        <Alert
          className={
            message.startsWith("Error:")
              ? "border-destructive/30 text-destructive"
              : "border-green-600/30 text-green-700 dark:text-green-400"
          }
        >
          <AlertTitle>{message.startsWith("Error:") ? "Error" : "Check your email"}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={handleChange}
          aria-invalid={Boolean(errors.email) || undefined}
          aria-describedby={errors.email ? `${emailId}-error` : undefined}
          required
        />
        {errors.email ? (
          <p id={`${emailId}-error`} className="text-sm text-destructive">
            {errors.email}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send reset link"}
      </Button>

      <div className="text-center text-sm">
        <a className="text-primary underline-offset-4 hover:underline" href="/auth/login">
          Back to login
        </a>
      </div>
    </form>
  );
}
