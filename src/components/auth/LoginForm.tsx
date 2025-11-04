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
    window.location.href = "/app/dashboard";
  });

  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)} noValidate data-testid="login-form">
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
