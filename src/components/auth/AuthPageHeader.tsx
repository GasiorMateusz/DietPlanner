import React from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface AuthPageHeaderProps {
  titleKey:
    | "auth.welcomeBack"
    | "auth.startPlanning"
    | "auth.createAccountTitle"
    | "auth.forgotPasswordTitle"
    | "auth.resetPasswordTitle";
  subtitleKey?: "auth.loginToAccount" | "auth.forgotPasswordSubtitle" | "auth.resetPasswordSubtitle";
}

/**
 * React component for auth page header that uses translations.
 * This ensures the title and subtitle are translated based on the current language.
 */
export function AuthPageHeader({ titleKey, subtitleKey }: AuthPageHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="mb-6 text-center">
      <h2 id="auth-page-title" className="text-2xl font-semibold" suppressHydrationWarning>
        {t(titleKey)}
      </h2>
      {subtitleKey && (
        <p className="text-sm text-muted-foreground mt-1" id="auth-page-subtitle" suppressHydrationWarning>
          {t(subtitleKey)}
        </p>
      )}
    </header>
  );
}
