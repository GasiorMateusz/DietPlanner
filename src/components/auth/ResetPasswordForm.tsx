import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth.schemas";
import { supabaseClient as supabase } from "@/db/supabase.client";
import { getAuthRedirectUrl } from "@/lib/utils/get-app-url";
import { getPasswordResetSuccessMessage, shouldShowPasswordResetError } from "@/lib/auth/password-reset.utils";

interface Props {
  className?: string;
}

export default function ResetPasswordForm({ className }: Props) {
  const [values, setValues] = React.useState<ResetPasswordInput>({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = React.useState<Partial<Record<keyof ResetPasswordInput, string>>>({});
  const [message, setMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showResendLink, setShowResendLink] = React.useState(false);
  const [resendEmail, setResendEmail] = React.useState("");
  const [resendMessage, setResendMessage] = React.useState<string | null>(null);
  const [isResending, setIsResending] = React.useState(false);
  const newPassId = React.useId();
  const confirmId = React.useId();
  const resendEmailId = React.useId();

  // Check for error parameters in URL hash on mount and verify session
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);

    // Step 1: Check for explicit errors in URL (expired token, access denied, etc.)
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const error = params.get("error");
      const errorCode = params.get("error_code");
      const errorDescription = params.get("error_description");

      if (error || errorCode) {
        // Decode the error description
        const decodedDescription = errorDescription ? decodeURIComponent(errorDescription.replace(/\+/g, " ")) : null;

        // Set appropriate error message and show resend link option
        if (errorCode === "otp_expired" || error?.includes("expired")) {
          setMessage("Reset link is invalid or expired. Please request a new link.");
          setShowResendLink(true);
        } else if (decodedDescription) {
          setMessage(decodedDescription);
          if (decodedDescription.includes("expired") || decodedDescription.includes("invalid")) {
            setShowResendLink(true);
          }
        } else if (error === "access_denied") {
          setMessage("Reset link is invalid or expired. Please request a new link.");
          setShowResendLink(true);
        } else {
          setMessage("An error occurred with the reset link. Please request a new one.");
          setShowResendLink(true);
        }

        // Clean up the URL hash
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        return; // Exit early - we have an explicit error
      }
    }

    // Step 2: Check if recovery token exists in URL
    const hasRecoveryToken = hash && (hash.includes("type=recovery") || hash.includes("access_token"));
    const hasTokenInSearch = searchParams.has("access_token") || searchParams.has("type");

    // Step 3: Set up auth state listener (always needed to detect when session is established)
    let authStateSubscription: {
      unsubscribe?: () => void;
      data?: { subscription?: { unsubscribe?: () => void } };
    } | null = null;

    const subscriptionResult = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        if (session) {
          // Session established successfully - clear any error messages
          setMessage(null);
          setShowResendLink(false);
        }
      } else if (event === "TOKEN_REFRESHED" && session) {
        setMessage(null);
        setShowResendLink(false);
      }
    });

    authStateSubscription = subscriptionResult as typeof authStateSubscription;

    // Step 4: Handle two scenarios
    if (hasRecoveryToken || hasTokenInSearch) {
      // Scenario A: Recovery token exists in URL
      // Don't show any errors - Supabase will process the token
      // User can submit the form even if session isn't detected yet
      // The form submission will trigger Supabase to process the token from the URL

      // Just clean up on unmount
      return () => {
        if (authStateSubscription) {
          if (typeof authStateSubscription.unsubscribe === "function") {
            authStateSubscription.unsubscribe();
          } else if (authStateSubscription.data?.subscription?.unsubscribe) {
            authStateSubscription.data.subscription.unsubscribe();
          }
        }
      };
    } else {
      // Scenario B: No recovery token in URL
      // This might be an invalid/expired link, but wait a bit to be sure
      // Sometimes Supabase processes tokens asynchronously
      let sessionCheckTimeout: NodeJS.Timeout;
      let hasShownError = false;

      const checkSession = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          // Session exists - clear any errors and stop checking
          if (hasShownError) {
            setMessage(null);
            setShowResendLink(false);
          }
          if (sessionCheckTimeout) {
            clearTimeout(sessionCheckTimeout);
          }
        } else if (!hasShownError) {
          // No session yet - wait longer before showing error
          // This gives Supabase time to process any tokens
          sessionCheckTimeout = setTimeout(async () => {
            // Final check before showing error
            const {
              data: { session: finalSession },
            } = await supabase.auth.getSession();

            if (!finalSession && !hasShownError) {
              hasShownError = true;
              setMessage(
                "No valid reset session found. The link may have expired or already been used. Please request a new link."
              );
              setShowResendLink(true);
            }
          }, 8000); // Wait 8 seconds - gives plenty of time for Supabase to process
        }
      };

      // Start checking after a short delay
      setTimeout(() => {
        checkSession();
      }, 2000); // Wait 2 seconds before first check

      // Cleanup
      return () => {
        if (sessionCheckTimeout) {
          clearTimeout(sessionCheckTimeout);
        }
        if (authStateSubscription) {
          if (typeof authStateSubscription.unsubscribe === "function") {
            authStateSubscription.unsubscribe();
          } else if (authStateSubscription.data?.subscription?.unsubscribe) {
            authStateSubscription.data.subscription.unsubscribe();
          }
        }
      };
    }
  }, []);

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
    setShowResendLink(false);
    if (!validate(values)) return;

    setIsSubmitting(true);

    // First, try to get the session - if there's a token in the URL, Supabase should process it
    // Even if we haven't detected a session yet, the token in the URL should work
    await supabase.auth.getSession();

    // If no session yet but we're on the reset page, Supabase might still process the URL token
    // Try to update the password anyway - Supabase will use the token from the URL if present
    const { error } = await supabase.auth.updateUser({
      password: values.newPassword,
    });

    if (error) {
      setIsSubmitting(false);
      // Handle specific error cases
      if (error.message.includes("expired") || error.message.includes("invalid") || error.message.includes("token")) {
        setMessage("Reset link is invalid or expired. Please request a new link.");
        setShowResendLink(true);
      } else if (error.message.includes("Password") || error.message.includes("password")) {
        setMessage("Password does not meet security requirements.");
      } else {
        setMessage("Unable to update password. Please try again later.");
      }
      return;
    }

    // Success - password updated
    // Check session again (it might have been established during updateUser)
    const sessionCheck = await supabase.auth.getSession();

    setIsSubmitting(false);

    if (sessionCheck.data.session) {
      // User is logged in, redirect to dashboard
      window.location.assign("/app/dashboard");
    } else {
      // No session, show success message and let user log in
      setMessage("Password updated successfully. You can now log in.");
    }
  }

  const isError =
    message &&
    (message.includes("invalid") ||
      message.includes("expired") ||
      message.includes("Unable") ||
      message.includes("requirements"));

  async function handleResendLink(e: React.FormEvent) {
    e.preventDefault();
    setResendMessage(null);

    if (!resendEmail || !resendEmail.includes("@")) {
      setResendMessage("Please enter a valid email address.");
      return;
    }

    setIsResending(true);

    // Get the full redirect URL for password reset
    const redirectTo = getAuthRedirectUrl("/auth/reset-password");

    // Log the redirect URL being sent to Supabase for debugging
    console.log("🔐 [Password Reset Resend] Sending redirectTo to Supabase:", redirectTo);
    console.log("🔐 [Password Reset Resend] PUBLIC_APP_URL:", import.meta.env.PUBLIC_APP_URL || "NOT SET");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resendEmail, {
        redirectTo,
      });

      setIsResending(false);

      if (error && shouldShowPasswordResetError()) {
        const errorMessage = error.message || "";
        const errorCode = (error as { code?: string }).code;
        setResendMessage(`Error: ${errorMessage}${errorCode ? ` (Code: ${errorCode})` : ""}.`);
        return;
      }

      // Success - show success message (security best practice to not reveal if email exists)
      setResendMessage(getPasswordResetSuccessMessage());
      setShowResendLink(false);
      // Clear the email field after successful send
      setResendEmail("");
    } catch {
      setIsResending(false);
      // Still show success message (security best practice)
      setResendMessage(getPasswordResetSuccessMessage());
      setShowResendLink(false);
      setResendEmail("");
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {message ? (
        <Alert
          className={
            isError
              ? "border-destructive/30 text-destructive"
              : "border-green-600/30 text-green-700 dark:text-green-400"
          }
        >
          <AlertTitle>{isError ? "Error" : "Success"}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      {showResendLink && !resendMessage ? (
        <div className="space-y-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Request a new reset link</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your email address and we&apos;ll send you a new password reset link.
            </p>
          </div>
          <form onSubmit={handleResendLink} className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor={resendEmailId}>Email address</Label>
              <Input
                id={resendEmailId}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="outline" className="w-full" disabled={isResending}>
              {isResending ? "Sending..." : "Send new reset link"}
            </Button>
          </form>
        </div>
      ) : null}

      {resendMessage ? (
        <Alert
          className={
            resendMessage.startsWith("Error:")
              ? "border-destructive/30 text-destructive"
              : "border-green-600/30 text-green-700 dark:text-green-400"
          }
        >
          <AlertTitle>{resendMessage.startsWith("Error:") ? "Error" : "Check your email"}</AlertTitle>
          <AlertDescription>{resendMessage}</AlertDescription>
        </Alert>
      ) : null}

      {!showResendLink && !resendMessage ? (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Updating password..." : "Set new password"}
          </Button>

          <div className="text-center text-sm space-y-2">
            <div>
              <a className="text-primary underline-offset-4 hover:underline" href="/auth/forgot-password">
                Need a new reset link?
              </a>
            </div>
            <div>
              <a className="text-primary underline-offset-4 hover:underline" href="/auth/login">
                Back to login
              </a>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center text-sm">
          <a className="text-primary underline-offset-4 hover:underline" href="/auth/login">
            Back to login
          </a>
        </div>
      )}
    </div>
  );
}
