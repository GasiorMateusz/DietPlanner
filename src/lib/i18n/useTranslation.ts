import { useContext } from "react";
import { TranslationContext } from "./TranslationProvider";
import type { TranslationKey } from "./types";
import enTranslations from "./translations/en.json";

/**
 * Custom hook to access translations and current language.
 * Handles SSR and hydration timing gracefully by providing default translations when context is not available.
 * @returns Translation function and current language code
 */
export function useTranslation() {
  const context = useContext(TranslationContext);

  // During SSR or if context is not available yet (hydration timing), use default English translations
  // This handles cases where:
  // 1. Component renders during SSR (context not available)
  // 2. Component hydrates before TranslationProvider is ready (Astro client:load timing)
  if (!context) {
    // Fallback: return default English translations with no-op setLanguage
    const t = (key: TranslationKey): string => {
      return (enTranslations as Record<string, string>)[key] || key;
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const setLanguage = async (_language: "en" | "pl"): Promise<void> => {
      // No-op: provider not available yet
    };
    return { t, language: "en" as const, setLanguage };
  }

  const { language, translations, setLanguage } = context;

  /**
   * Translates a key to its corresponding string value.
   * Falls back to the key itself if translation is missing.
   * @param key - Translation key
   * @returns Translated string or the key itself if missing
   */
  const t = (key: TranslationKey): string => {
    const translation = translations[key];

    if (!translation) {
      // Log warning in development mode
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(`Missing translation for key: ${key}`);
      }
      // Return key as fallback
      return key;
    }

    return translation;
  };

  return { t, language, setLanguage };
}
