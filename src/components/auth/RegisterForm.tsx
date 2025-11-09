import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth.schemas";
import { supabaseClient as supabase } from "@/db/supabase.client";

interface Props {
  className?: string;
}

export default function RegisterForm({ className }: Props) {
  const emailId = React.useId();
  const passwordId = React.useId();
  const confirmId = React.useId();
  const termsId = React.useId();
  const [success, setSuccess] = React.useState<string | null>(null);

  // Cast defaultValues to avoid strict literal type mismatch between
  // the zod literal(true) validator and our UI default (unchecked).
  // The runtime validation will still enforce `termsAccepted === true`.
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    } as unknown as RegisterInput,
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit(async (data) => {
    setSuccess(null);
    form.clearErrors("root");

    // Get the base URL for the redirect - use PUBLIC_APP_URL if available, otherwise use window.location.origin
    const baseUrl = import.meta.env.PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
    const redirectTo = `${baseUrl}/auth/login`;

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      // Handle specific error cases
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        form.setError("root", { message: "An account with this email already exists." });
      } else if (error.message.includes("Password") || error.message.includes("password")) {
        form.setError("root", { message: "Password does not meet security requirements." });
      } else {
        form.setError("root", { message: "Unable to register right now. Please try again later." });
      }
      return;
    }

    // Check if email confirmation is required
    // If session is null, user needs to confirm email
    // If session exists, user is automatically logged in
    if (!signUpData.session) {
      // Email confirmation required
      setSuccess("Account created! Please check your email to confirm your account before signing in.");
    } else {
      // Email confirmation disabled - user is automatically logged in
      // Use full page reload to ensure cookies are synced and middleware can detect session
      // eslint-disable-next-line react-compiler/react-compiler
      window.location.assign("/app/dashboard");
    }
  });

  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)} noValidate>
      {form.formState.errors.root ? (
        <Alert className="border-destructive/30 text-destructive">
          <AlertTitle>Unable to register</AlertTitle>
          <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert className="border-green-600/30 text-green-700 dark:text-green-400">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
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
          {...form.register("email")}
          aria-invalid={Boolean(form.formState.errors.email) || undefined}
          aria-describedby={form.formState.errors.email ? `${emailId}-error` : undefined}
        />
        {form.formState.errors.email ? (
          <p id={`${emailId}-error`} className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={passwordId}>Password</Label>
        <Input
          id={passwordId}
          type="password"
          autoComplete="new-password"
          {...form.register("password")}
          aria-invalid={Boolean(form.formState.errors.password) || undefined}
          aria-describedby={form.formState.errors.password ? `${passwordId}-error` : undefined}
        />
        {form.formState.errors.password ? (
          <p id={`${passwordId}-error`} className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">At least 8 characters with letters and numbers.</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={confirmId}>Confirm password</Label>
        <Input
          id={confirmId}
          type="password"
          autoComplete="new-password"
          {...form.register("confirmPassword")}
          aria-invalid={Boolean(form.formState.errors.confirmPassword) || undefined}
          aria-describedby={form.formState.errors.confirmPassword ? `${confirmId}-error` : undefined}
        />
        {form.formState.errors.confirmPassword ? (
          <p id={`${confirmId}-error`} className="text-sm text-destructive">
            {form.formState.errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      <div className="flex items-start gap-2">
        <input
          id={termsId}
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-input"
          {...form.register("termsAccepted")}
          aria-invalid={Boolean(form.formState.errors.termsAccepted) || undefined}
          aria-describedby={form.formState.errors.termsAccepted ? `${termsId}-error` : undefined}
        />
        <div>
          <Label htmlFor={termsId} className="cursor-pointer">
            I agree to the Terms and Privacy Policy
          </Label>
          {form.formState.errors.termsAccepted ? (
            <p id={`${termsId}-error`} className="text-sm text-destructive">
              {form.formState.errors.termsAccepted.message}
            </p>
          ) : null}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Creating account..." : "Create account"}
      </Button>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <a className="text-primary underline-offset-4 hover:underline" href="/auth/login">
          Log in
        </a>
      </div>
    </form>
  );
}
