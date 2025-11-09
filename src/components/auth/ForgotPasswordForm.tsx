import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth.schemas";
import { supabaseClient as supabase } from "@/db/supabase.client";

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

    // Get the base URL for the redirect - use PUBLIC_APP_URL if available, otherwise use window.location.origin
    const baseUrl = import.meta.env.PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
    const redirectTo = `${baseUrl}/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo,
    });

    setIsSubmitting(false);

    // Always show success message regardless of error (security best practice)
    // This prevents email enumeration attacks
    setMessage("If an account exists for this email, we sent a password reset link.");

    // Log error for debugging but don't show to user
    if (error) {
      console.error("Password reset error:", error);
    }
  }

  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)} noValidate>
      {message ? (
        <Alert className="border-green-600/30 text-green-700 dark:text-green-400">
          <AlertTitle>Check your email</AlertTitle>
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
