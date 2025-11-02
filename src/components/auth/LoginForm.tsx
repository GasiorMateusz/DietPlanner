import React from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { loginSchema, type LoginInput } from "@/lib/validation/auth.schemas";

type Props = {
  className?: string;
};

export default function LoginForm({ className }: Props) {
  const [values, setValues] = React.useState<LoginInput>({ email: "", password: "" });
  const [errors, setErrors] = React.useState<Partial<Record<keyof LoginInput, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const emailId = React.useId();
  const passwordId = React.useId();

  function handleChange<K extends keyof LoginInput>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [key]: e.target.value }));
    };
  }

  function validate(input: LoginInput) {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof LoginInput, string>> = {};
      for (const issue of parsed.error.issues) {
        const pathKey = issue.path[0] as keyof LoginInput | undefined;
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
    setSuccess("Form is valid. Implement login logic next.");
  }

  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)} noValidate>
      {formError ? (
        <Alert className="border-destructive/30 text-destructive">
          <AlertTitle>Unable to log in</AlertTitle>
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
          autoComplete="current-password"
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
        ) : null}
      </div>

      <Button type="submit" className="w-full">
        Log in
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


