import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth.schemas";
import { supabaseClient as supabase } from "@/db/supabase.client";
import { getAuthRedirectUrl } from "@/lib/utils/get-app-url";
import { getPasswordResetSuccessMessage, shouldShowPasswordResetError } from "@/lib/auth/password-reset.utils";

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!validate(values)) return;

    setIsSubmitting(true);

    // Get the full redirect URL for password reset
    // This ensures we always use the correct production URL, not localhost
    const redirectTo = getAuthRedirectUrl("/auth/reset-password");

    // Log the redirect URL being sent to Supabase for debugging
    console.log("🔐 [Password Reset] Sending redirectTo to Supabase:", redirectTo);
    console.log("🔐 [Password Reset] PUBLIC_APP_URL:", import.meta.env.PUBLIC_APP_URL || "NOT SET");
    console.log("🔐 [Password Reset] Current window.location.origin:", typeof window !== "undefined" ? window.location.origin : "N/A");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo,
      });

      setIsSubmitting(false);

      if (error && shouldShowPasswordResetError()) {
        const errorMessage = error.message || "";
        const errorCode = (error as { code?: string }).code;

        // Show error message - always show for cloud Supabase, or in dev mode
        setMessage(`Error: ${errorMessage}${errorCode ? ` (Code: ${errorCode})` : ""}.`);
        return;
      }

      // In production, always show success message regardless of error (security best practice)
      // This prevents email enumeration attacks
      setMessage(getPasswordResetSuccessMessage());
    } catch {
      setIsSubmitting(false);
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
