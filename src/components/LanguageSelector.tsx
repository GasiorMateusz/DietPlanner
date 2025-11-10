import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { LanguageCode } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  className?: string;
}

/**
 * Language toggle component that allows users to switch between English and Polish.
 * Displays flag icons for each language and updates preference when clicked.
 */
export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useTranslation();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localLanguage, setLocalLanguage] = useState<LanguageCode>(language);

  // Sync local language with context language
  useEffect(() => {
    setLocalLanguage(language);
  }, [language]);

  // Handle language change
  const handleLanguageChange = async (newLanguage: LanguageCode) => {
    if (isUpdating || newLanguage === localLanguage) {
      return;
    }

    // Update local state immediately for instant UI feedback
    setLocalLanguage(newLanguage);
    setError(null);
    setIsUpdating(true);

    // Update language preference asynchronously
    try {
      await setLanguage(newLanguage);
    } catch (err) {
      // Revert local state on error
      setLocalLanguage(language);
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
          variant="ghost"
          size="sm"
          onClick={() => handleLanguageChange("en")}
          disabled={isUpdating}
          aria-label={t("nav.language.english")}
          aria-pressed={localLanguage === "en"}
          className={cn(
            "h-8 px-2.5 text-sm font-medium transition-all relative",
            "rounded-md",
            localLanguage === "en"
              ? "bg-accent text-accent-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          EN
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleLanguageChange("pl")}
          disabled={isUpdating}
          aria-label={t("nav.language.polish")}
          aria-pressed={localLanguage === "pl"}
          className={cn(
            "h-8 px-2.5 text-sm font-medium transition-all relative",
            "rounded-md",
            localLanguage === "pl"
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
