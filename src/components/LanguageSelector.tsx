import React, { useState, useEffect } from "react";
import { Select } from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { LanguageCode } from "@/lib/i18n/types";

interface LanguageSelectorProps {
  className?: string;
}

/**
 * Language selector component that allows users to switch between English and Polish.
 * Displays current language and updates preference when changed.
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
  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value as LanguageCode;

    // Validate language code
    if (newLanguage !== "en" && newLanguage !== "pl") {
      setError("Invalid language selection");
      return;
    }

    if (newLanguage === localLanguage) {
      return;
    }

    // Update local state immediately for instant UI feedback
    setLocalLanguage(newLanguage);
    setError(null);
    setIsUpdating(true);

    // Update language preference asynchronously
    setLanguage(newLanguage).catch((err) => {
      // Revert local state on error
      setLocalLanguage(language);
      const errorMessage = err instanceof Error ? err.message : t("common.error");
      setError(errorMessage);
      // eslint-disable-next-line no-console
      console.error("Error updating language preference:", err);
    }).finally(() => {
      setIsUpdating(false);
    });
  };

  return (
    <div className={className}>
      <Select
        value={localLanguage}
        onChange={handleLanguageChange}
        disabled={isUpdating}
        aria-label={t("nav.language")}
        className="w-auto min-w-[120px]"
      >
        <option value="en">{t("nav.language.english")}</option>
        <option value="pl">{t("nav.language.polish")}</option>
      </Select>
      {error && (
        <p className="mt-1 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
