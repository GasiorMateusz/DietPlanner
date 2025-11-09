import React, { useState } from "react";
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

  // Handle language change
  const handleLanguageChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value as LanguageCode;

    // Validate language code
    if (newLanguage !== "en" && newLanguage !== "pl") {
      setError("Invalid language selection");
      return;
    }

    if (newLanguage === language) return;

    setError(null);
    setIsUpdating(true);

    try {
      // setLanguage handles persistence and optimistic updates
      await setLanguage(newLanguage);
    } catch (err) {
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
      <Select
        value={language}
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
