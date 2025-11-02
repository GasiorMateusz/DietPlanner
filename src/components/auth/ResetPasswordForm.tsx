import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth.schemas";

type Props = {
  className?: string;
};

export default function ResetPasswordForm({ className }: Props) {
  const [values, setValues] = React.useState<ResetPasswordInput>({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = React.useState<Partial<Record<keyof ResetPasswordInput, string>>>({});
  const [message, setMessage] = React.useState<string | null>(null);
  const newPassId = React.useId();
  const confirmId = React.useId();

  function handleChange<K extends keyof ResetPasswordInput>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [key]: e.target.value }));
    };
  }

  function validate(input: ResetPasswordInput) {
    const parsed = resetPasswordSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof ResetPasswordInput, string>> = {};
      for (const issue of parsed.error.issues) {
        const pathKey = issue.path[0] as keyof ResetPasswordInput | undefined;
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
    // Placeholder; real request will be implemented later.
    setMessage("Password updated. You can now log in.");
  }

  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)} noValidate>
      {message ? (
        <Alert className="border-green-600/30 text-green-700 dark:text-green-400">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor={newPassId}>New password</Label>
        <Input
          id={newPassId}
          type="password"
          autoComplete="new-password"
          value={values.newPassword}
          onChange={handleChange("newPassword")}
          aria-invalid={Boolean(errors.newPassword) || undefined}
          aria-describedby={errors.newPassword ? `${newPassId}-error` : undefined}
          required
        />
        {errors.newPassword ? (
          <p id={`${newPassId}-error`} className="text-sm text-destructive">
            {errors.newPassword}
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

      <Button type="submit" className="w-full">
        Set new password
      </Button>

      <div className="text-center text-sm">
        <a className="text-primary underline-offset-4 hover:underline" href="/auth/login">
          Back to login
        </a>
      </div>
    </form>
  );
}
