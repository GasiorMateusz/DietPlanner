import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { loginSchema, type LoginInput } from "@/lib/validation/auth.schemas";
import { supabaseClient as supabase } from "@/db/supabase.client";

interface Props {
  className?: string;
}

export default function LoginForm({ className }: Props) {
  const emailId = React.useId();
  const passwordId = React.useId();
  const formRef = React.useRef<HTMLFormElement | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      form.setError("root", { message: "Invalid email or password." });
      return;
    }

    // Use full page reload to ensure cookies are synced and middleware can detect session
    // eslint-disable-next-line react-compiler/react-compiler
    window.location.href = "/app/dashboard";
  });

  React.useEffect(() => {
    // mark the form as hydrated on the client so E2E tests can wait for JS handlers
    try {
      formRef.current?.setAttribute("data-hydrated", "true");
    } catch {
      // ignore — best-effort for tests only
    }
  }, []);

  return (
    <form ref={formRef} onSubmit={onSubmit} className={cn("space-y-4", className)} noValidate data-testid="login-form">
      {form.formState.errors.root ? (
        <Alert className="border-destructive/30 text-destructive">
          <AlertTitle>Unable to log in</AlertTitle>
          <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
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
          data-testid="login-email-input"
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
          autoComplete="current-password"
          {...form.register("password")}
          aria-invalid={Boolean(form.formState.errors.password) || undefined}
          aria-describedby={form.formState.errors.password ? `${passwordId}-error` : undefined}
          data-testid="login-password-input"
        />
        {form.formState.errors.password ? (
          <p id={`${passwordId}-error`} className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting} data-testid="login-submit-button">
        {form.formState.isSubmitting ? "Logging in..." : "Log in"}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <a className="text-primary underline-offset-4 hover:underline" href="/auth/forgot-password">
          Forgot password?
        </a>
        <a className="text-primary underline-offset-4 hover:underline" href="/auth/register">
          Create account
        </a>
      </div>
    </form>
  );
}

// Set a small effect that marks the form as hydrated when the React island mounts.
// This helps end-to-end tests reliably detect that client-side JS has attached handlers
// (avoiding native form submits in cases where hydration is still pending).
// The attribute is set only on the client during hydration and does not affect SSR output.
