import React, { useEffect, useState, useCallback } from "react";
import { navigate } from "astro:transitions/client";
import { Button } from "@/components/ui/button";
import { supabaseClient as supabase } from "@/db/supabase.client";
import { DeleteAccountConfirmationDialog } from "@/components/auth/DeleteAccountConfirmationDialog";
import { getAuthToken } from "@/lib/auth/get-auth-token";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { isRefreshTokenNotFoundError } from "@/lib/auth/auth-error.utils";

interface NavBarProps {
  userEmail?: string;
  className?: string;
}

/**
 * Navigation bar component with user menu and logout functionality.
 * Shows different navigation options based on authentication state.
 */
export function NavBar({ userEmail: initialUserEmail, className }: NavBarProps) {
  const { t } = useTranslation();
  const [userEmail, setUserEmail] = useState<string | undefined>(initialUserEmail);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Check auth state on mount and when it changes
  // Use getUser() to verify the session is authentic
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        // Ignore refresh token errors - they're harmless if user can still authenticate
        if (error && isRefreshTokenNotFoundError(error)) {
          setUserEmail(undefined);
          return;
        }

        if (session?.access_token) {
          const {
            data: { user },
          } = await supabase.auth.getUser(session.access_token);
          setUserEmail(user?.email);
        } else {
          setUserEmail(undefined);
        }
      } catch (error) {
        // Ignore refresh token errors silently
        if (isRefreshTokenNotFoundError(error)) {
          setUserEmail(undefined);
          return;
        }
        setUserEmail(undefined);
      }
    };

    checkSession();

    // Listen for auth changes - onAuthStateChange provides verified session data
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.access_token) {
          const {
            data: { user },
          } = await supabase.auth.getUser(session.access_token);
          setUserEmail(user?.email);
        } else {
          setUserEmail(undefined);
        }
      } catch (error) {
        // Ignore refresh token errors silently
        if (isRefreshTokenNotFoundError(error)) {
          setUserEmail(undefined);
          return;
        }
        setUserEmail(undefined);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);

    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch {
      navigate("/");
    } finally {
      setIsLoggingOut(false);
    }
  }, []);

  async function handleDeleteAccount() {
    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        window.location.href = "/auth/login";
        return;
      }

      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        window.location.href = "/auth/login";
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Failed to delete account",
        }));
        throw new Error(errorData.error || "Failed to delete account");
      }

      // Success: Sign out and redirect
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred. Please try again.";
      setDeleteError(errorMessage);
    } finally {
      setIsDeletingAccount(false);
    }
  }

  const handleOpenDeleteDialog = useCallback(() => {
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    if (!isDeletingAccount) {
      setIsDeleteDialogOpen(false);
      setDeleteError(null);
    }
  }, [isDeletingAccount]);

  return (
    <nav className={`w-full border-b bg-background shadow-sm ${className || ""}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <a
            href="/app/dashboard"
            className="flex items-center gap-2 text-xl font-bold text-foreground hover:opacity-80 transition-opacity"
            aria-label="Diet Planner Home"
          >
            <img src="/favicon.png" alt="Diet Planner" className="h-6 w-6" />
            <span>Diet Planner</span>
          </a>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {userEmail ? (
              <>
                <ThemeToggle />
                <LanguageSelector />
                <span
                  className="hidden sm:inline-block text-sm text-muted-foreground truncate max-w-[200px]"
                  aria-label="Logged in as"
                  title={userEmail}
                >
                  {userEmail}
                </span>
                <Button
                  variant="ghost"
                  onClick={handleOpenDeleteDialog}
                  disabled={isDeletingAccount}
                  aria-label={t("nav.deleteAccount")}
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 min-w-[120px]"
                >
                  {t("nav.deleteAccount")}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  aria-label={t("nav.logout")}
                  size="sm"
                  className="min-w-[100px]"
                >
                  {isLoggingOut ? t("auth.loggingOut") : t("nav.logout")}
                </Button>
              </>
            ) : (
              <a href="/auth/login">
                <Button variant="ghost" size="sm" className="min-w-[100px]">
                  {t("nav.login")}
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      <DeleteAccountConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteAccount}
        isDeleting={isDeletingAccount}
        error={deleteError}
      />
    </nav>
  );
}
