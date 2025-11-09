import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth.schemas";
import { supabaseClient as supabase } from "@/db/supabase.client";

interface Props {
  className?: string;
}

export default function ResetPasswordForm({ className }: Props) {
  const [values, setValues] = React.useState<ResetPasswordInput>({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = React.useState<Partial<Record<keyof ResetPasswordInput, string>>>({});
  const [message, setMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const newPassId = React.useId();
  const confirmId = React.useId();

  // Check for error parameters in URL hash on mount and verify session
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    
    // Parse hash parameters (format: #error=...&error_code=...&error_description=...)
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const error = params.get("error");
      const errorCode = params.get("error_code");
      const errorDescription = params.get("error_description");

      if (error || errorCode) {
        // Decode the error description
        const decodedDescription = errorDescription ? decodeURIComponent(errorDescription.replace(/\+/g, " ")) : null;
        
        // Set appropriate error message
        if (errorCode === "otp_expired" || error?.includes("expired")) {
          setMessage("Reset link is invalid or expired. Please request a new link.");
        } else if (decodedDescription) {
          setMessage(decodedDescription);
        } else if (error === "access_denied") {
          setMessage("Reset link is invalid or expired. Please request a new link.");
        } else {
          setMessage("An error occurred with the reset link. Please request a new one.");
        }

        // Clean up the URL hash
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        return;
      }
    }

    // Check if hash contains recovery token (type=recovery or access_token)
    const hasRecoveryToken = hash && (hash.includes("type=recovery") || hash.includes("access_token"));
    
    // Also check search params (sometimes tokens are in query string instead of hash)
    const searchParams = new URLSearchParams(window.location.search);
    const hasTokenInSearch = searchParams.has("access_token") || searchParams.has("type");

    // Wait for Supabase to process the hash and establish a session
    // Use onAuthStateChange to detect when session is ready
    let sessionCheckTimeout: NodeJS.Timeout;
    let authStateSubscription: { unsubscribe?: () => void; data?: { subscription?: { unsubscribe?: () => void } } } | null = null;
    let hasShownError = false;

    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        if (!hasShownError) {
          hasShownError = true;
          setMessage("Error checking session. Please try submitting the form.");
        }
      } else if (session) {
        // Session exists, user can proceed - clear any error message
        if (hasShownError) {
          setMessage(null);
        }
        if (authStateSubscription) {
          // Handle different return types from onAuthStateChange
          if (typeof authStateSubscription.unsubscribe === 'function') {
            authStateSubscription.unsubscribe();
          } else if (authStateSubscription.data?.subscription?.unsubscribe) {
            authStateSubscription.data.subscription.unsubscribe();
          }
        }
        if (sessionCheckTimeout) {
          clearTimeout(sessionCheckTimeout);
        }
      } else {
        // If we have a recovery token in the hash or search params, wait longer for Supabase to process it
        if (hasRecoveryToken || hasTokenInSearch) {
          // Don't show error yet - wait for auth state change
          // Increase timeout if we have tokens
          if (sessionCheckTimeout) {
            clearTimeout(sessionCheckTimeout);
          }
          sessionCheckTimeout = setTimeout(() => {
            if (!hasShownError) {
              hasShownError = true;
              setMessage("Session not established. The reset link may be invalid. Please try submitting the form or request a new link.");
            }
          }, 5000); // Wait 5 seconds if we have tokens
        } else if (!hasShownError) {
          // No recovery token and no session - show error after delay
          sessionCheckTimeout = setTimeout(() => {
            if (!hasShownError) {
              hasShownError = true;
              setMessage("No valid reset session found. The link may have expired or already been used. Please request a new link.");
            }
          }, 3000); // Wait 3 seconds for Supabase to process the hash
        }
      }
    };

    // Listen for auth state changes (when Supabase processes the hash)
    const subscriptionResult = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        if (session) {
          hasShownError = false;
          setMessage(null); // Clear any error message
          if (sessionCheckTimeout) {
            clearTimeout(sessionCheckTimeout);
          }
          if (authStateSubscription) {
            // Handle different return types from onAuthStateChange
            if (typeof authStateSubscription.unsubscribe === 'function') {
              authStateSubscription.unsubscribe();
            } else if (authStateSubscription.data?.subscription?.unsubscribe) {
              authStateSubscription.data.subscription.unsubscribe();
            }
          }
        }
      } else if (event === "TOKEN_REFRESHED" && session) {
          hasShownError = false;
          setMessage(null);
      }
    });
    
    // Store subscription - handle different return types
    authStateSubscription = subscriptionResult as typeof authStateSubscription;

    // Initial session check - wait a bit for Supabase to process hash
    setTimeout(() => {
      checkSession();
    }, 500); // Small delay to let Supabase process the hash

    // Cleanup
    return () => {
      if (sessionCheckTimeout) {
        clearTimeout(sessionCheckTimeout);
      }
      if (authStateSubscription) {
        // Handle different return types from onAuthStateChange
        if (typeof authStateSubscription.unsubscribe === 'function') {
          authStateSubscription.unsubscribe();
        } else if (authStateSubscription.data?.subscription?.unsubscribe) {
          authStateSubscription.data.subscription.unsubscribe();
        }
      }
    };
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
    if (!validate(values)) return;

    setIsSubmitting(true);

    // Update password using Supabase Auth
    // When user arrives via password reset link, Supabase creates a temporary session
    const { error } = await supabase.auth.updateUser({
      password: values.newPassword,
    });

    setIsSubmitting(false);

    if (error) {
      // Handle specific error cases
      if (error.message.includes("expired") || error.message.includes("invalid")) {
        setMessage("Reset link is invalid or expired. Please request a new link.");
      } else if (error.message.includes("Password") || error.message.includes("password")) {
        setMessage("Password does not meet security requirements.");
      } else {
        setMessage("Unable to update password. Please try again later.");
      }
      return;
    }

    // Success - password updated
    // Check if user has a session (they should after clicking reset link)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      // User is logged in, redirect to dashboard
      window.location.assign("/app/dashboard");
    } else {
      // No session, show success message and let user log in
      setMessage("Password updated. You can now log in.");
    }
  }

  const isError =
    message &&
    (message.includes("invalid") ||
      message.includes("expired") ||
      message.includes("Unable") ||
      message.includes("requirements"));

  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)} noValidate>
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

      <div className="text-center text-sm">
        <a className="text-primary underline-offset-4 hover:underline" href="/auth/login">
          Back to login
        </a>
      </div>
    </form>
  );
}
