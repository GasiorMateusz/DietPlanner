import React, { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { TranslationContext } from "@/lib/i18n/TranslationProvider";
import type { LanguageCode } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";
import { userPreferencesApi } from "@/lib/api/user-preferences.client";

interface LanguageSelectorProps {
  className?: string;
}

/**
 * Language toggle component that allows users to switch between English and Polish.
 * Displays flag icons for each language and updates preference when clicked.
 * Works even when TranslationProvider is not yet available (handles hydration timing).
 */
export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useTranslation();
  const context = useContext(TranslationContext);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use language directly from hook - it handles hydration and localStorage syncing
  // The hook ensures it always starts with "en" to match server render, then syncs after hydration
  const displayLanguage = language;

  // Handle language change
  const handleLanguageChange = async (newLanguage: LanguageCode, event?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent any default button behavior (form submission, etc.)
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (isUpdating || newLanguage === displayLanguage) {
      return;
    }

    setError(null);
    setIsUpdating(true);

    try {
      // If context is available, use the provider's setLanguage
      if (context) {
        await setLanguage(newLanguage);
      } else {
        // Context not available yet (hydration timing) - update directly
        // Store in localStorage for cross-island sync
        localStorage.setItem("app-language", newLanguage);
        // Dispatch custom event for same-tab sync (dispatch synchronously for immediate effect)
        const event = new CustomEvent("languagechange", {
          detail: newLanguage,
          bubbles: true,
          cancelable: false,
        });
        window.dispatchEvent(event);

        // Try to save preference asynchronously (don't block)
        // Only try if user is authenticated (check token first to avoid redirect)
        try {
          const { getAuthToken } = await import("@/lib/auth/get-auth-token");
          const token = await getAuthToken();
          // Only call API if user is authenticated
          if (token) {
            await userPreferencesApi.updateLanguagePreference({ language: newLanguage });
          }
          // If no token, that's fine - language is stored in localStorage for the session
        } catch (apiError) {
          // Ignore all errors - language change is stored in localStorage anyway
          // This prevents redirects on auth pages
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.warn("Failed to persist language preference (stored in localStorage only):", apiError);
          }
        }
      }
    } catch (err) {
      // Error handling - language state will be managed by the hook/context
      const errorMessage = err instanceof Error ? err.message : t("common.error");
      setError(errorMessage);
      // eslint-disable-next-line no-console
      console.error("Error updating language preference:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={className}>
      <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5 shadow-sm">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => handleLanguageChange("en", e)}
          disabled={isUpdating}
          aria-label={t("nav.language.english")}
          aria-pressed={displayLanguage === "en"}
          className={cn(
            "h-8 px-2.5 text-sm font-medium transition-all relative",
            "rounded-md",
            displayLanguage === "en"
              ? "bg-accent text-accent-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          EN
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => handleLanguageChange("pl", e)}
          disabled={isUpdating}
          aria-label={t("nav.language.polish")}
          aria-pressed={displayLanguage === "pl"}
          className={cn(
            "h-8 px-2.5 text-sm font-medium transition-all relative",
            "rounded-md",
            displayLanguage === "pl"
              ? "bg-accent text-accent-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          PL
        </Button>
      </div>
      {error && (
        <p className="mt-1 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
