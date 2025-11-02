import React from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth.schemas";

type Props = {
  className?: string;
};

export default function RegisterForm({ className }: Props) {
  const [values, setValues] = React.useState<RegisterInput>({
    email: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof RegisterInput, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const emailId = React.useId();
  const passwordId = React.useId();
  const confirmId = React.useId();
  const termsId = React.useId();

  function handleChange<K extends keyof RegisterInput>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = key === "termsAccepted" ? (e.target as HTMLInputElement).checked : e.target.value;
      setValues((v) => ({ ...v, [key]: value as any }));
    };
  }

  function validate(input: RegisterInput) {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof RegisterInput, string>> = {};
      for (const issue of parsed.error.issues) {
        const pathKey = issue.path[0] as keyof RegisterInput | undefined;
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
    setFormError(null);
    setSuccess(null);
    if (!validate(values)) return;
    // Backend integration will be implemented later. For now, show a placeholder.
    setSuccess("Form is valid. Implement registration logic next.");
  }

  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)} noValidate>
      {formError ? (
        <Alert className="border-destructive/30 text-destructive">
          <AlertTitle>Unable to register</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
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
          value={values.email}
          onChange={handleChange("email")}
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

      <div className="grid gap-2">
        <Label htmlFor={passwordId}>Password</Label>
        <Input
          id={passwordId}
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={handleChange("password")}
          aria-invalid={Boolean(errors.password) || undefined}
          aria-describedby={errors.password ? `${passwordId}-error` : undefined}
          required
        />
        {errors.password ? (
          <p id={`${passwordId}-error`} className="text-sm text-destructive">
            {errors.password}
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
          value={values.confirmPassword}
          onChange={handleChange("confirmPassword")}
          aria-invalid={Boolean(errors.confirmPassword) || undefined}
          aria-describedby={errors.confirmPassword ? `${confirmId}-error` : undefined}
          required
        />
        {errors.confirmPassword ? (
          <p id={`${confirmId}-error`} className="text-sm text-destructive">
            {errors.confirmPassword}
          </p>
        ) : null}
      </div>

      <div className="flex items-start gap-2">
        <input
          id={termsId}
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-input"
          checked={values.termsAccepted}
          onChange={handleChange("termsAccepted")}
          aria-invalid={Boolean(errors.termsAccepted) || undefined}
          aria-describedby={errors.termsAccepted ? `${termsId}-error` : undefined}
          required
        />
        <div>
          <Label htmlFor={termsId} className="cursor-pointer">
            I agree to the Terms and Privacy Policy
          </Label>
          {errors.termsAccepted ? (
            <p id={`${termsId}-error`} className="text-sm text-destructive">
              {errors.termsAccepted}
            </p>
          ) : null}
        </div>
      </div>

      <Button type="submit" className="w-full">
        Create account
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


