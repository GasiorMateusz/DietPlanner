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
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getAuthRedirectUrl } from "@/lib/utils/get-app-url";

interface Props {
  className?: string;
}

export default function RegisterForm({ className }: Props) {
  const { t } = useTranslation();
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

    // Get the full redirect URL for email confirmation
    // This ensures we always use the correct production URL, not localhost
    const redirectTo = getAuthRedirectUrl("/auth/login");

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
        form.setError("root", { message: t("auth.emailExists") });
      } else if (error.message.includes("Password") || error.message.includes("password")) {
        form.setError("root", { message: t("auth.passwordRequirements") });
      } else {
        form.setError("root", { message: t("auth.registerFailed") });
      }
      return;
    }

    // Check if email confirmation is required
    // If session is null, user needs to confirm email
    // If session exists, user is automatically logged in
    if (!signUpData.session) {
      // Email confirmation required
      setSuccess(t("auth.accountCreated"));
    } else {
      // Email confirmation disabled - user is automatically logged in
      // Verify session is established and wait for cookies to be set
      // This prevents redirect loops when middleware checks before cookies are available
      let sessionConfirmed = false;
      for (let i = 0; i < 10; i++) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          sessionConfirmed = true;
          break;
        }
        // Wait 50ms between checks
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      if (sessionConfirmed) {
        // Use full page reload to ensure cookies are synced and middleware can detect session
        // eslint-disable-next-line react-compiler/react-compiler
        window.location.href = "/app/dashboard";
      } else {
        // If session not confirmed, show success message but don't redirect
        // User can manually navigate or try again
        setSuccess(t("auth.accountCreated"));
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)} noValidate>
      {form.formState.errors.root ? (
        <Alert className="border-destructive/30 text-destructive">
          <AlertTitle>{t("auth.registerError")}</AlertTitle>
          <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert className="border-green-600/30 text-green-700 dark:text-green-400">
          <AlertTitle>{t("common.success")}</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor={emailId}>{t("auth.email")}</Label>
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
        <Label htmlFor={passwordId}>{t("auth.password")}</Label>
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
          <p className="text-sm text-muted-foreground">{t("auth.passwordHint")}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={confirmId}>{t("auth.confirmPassword")}</Label>
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
            {t("auth.termsAccept")}
          </Label>
          {form.formState.errors.termsAccepted ? (
            <p id={`${termsId}-error`} className="text-sm text-destructive">
              {form.formState.errors.termsAccepted.message}
            </p>
          ) : null}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? t("auth.creatingAccount") : t("auth.createAccount")}
      </Button>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">{t("auth.alreadyHaveAccount")} </span>
        <a className="text-primary underline-offset-4 hover:underline" href="/auth/login">
          {t("auth.login")}
        </a>
      </div>
    </form>
  );
}
