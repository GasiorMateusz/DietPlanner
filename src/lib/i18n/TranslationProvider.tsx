import React, { createContext, useEffect, useState, type ReactNode } from "react";
import type { LanguageCode, Translations } from "./types";
import enTranslations from "./translations/en.json";
import plTranslations from "./translations/pl.json";
import { userPreferencesApi } from "@/lib/api/user-preferences.client";

/**
 * Translation context value type.
 */
interface TranslationContextValue {
  language: LanguageCode;
  translations: Translations;
  setLanguage: (language: LanguageCode) => Promise<void>;
  isLoading: boolean;
}

/**
 * Translation context.
 */
export const TranslationContext = createContext<TranslationContextValue | null>(null);

/**
 * Props for TranslationProvider component.
 */
interface TranslationProviderProps {
  children: ReactNode;
  /**
   * Initial language to use before fetching user preference.
   * Defaults to "en".
   */
  initialLanguage?: LanguageCode;
}

/**
 * Translation provider component that manages language state and translations.
 * Fetches user language preference on mount and provides translation context to children.
 */
export function TranslationProvider({ children, initialLanguage = "en" }: TranslationProviderProps) {
  const [language, setLanguageState] = useState<LanguageCode>(initialLanguage);
  const [isLoading, setIsLoading] = useState(true);

  // Load translations based on current language
  const translations: Translations = language === "pl" ? plTranslations : enTranslations;

  /**
   * Updates the language state and persists to database.
   * This function is exposed via context for components to update language.
   */
  const setLanguage = async (newLanguage: LanguageCode) => {
    if (newLanguage === language) return;

    const previousLanguage = language;
    // Optimistic update
    setLanguageState(newLanguage);

    try {
      await userPreferencesApi.updateLanguagePreference({ language: newLanguage });
    } catch (error) {
      // Revert on error
      setLanguageState(previousLanguage);
      if (import.meta.env.DEV) {
        console.error("Failed to persist language preference:", error);
      }
    }
  };

  // Fetch user language preference on mount
  useEffect(() => {
    const fetchLanguagePreference = async () => {
      try {
        setIsLoading(true);
        const preference = await userPreferencesApi.getLanguagePreference();
        setLanguageState(preference.language);
      } catch (error) {
        // If API call fails (e.g., user not authenticated, network error),
        // fall back to default language
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn("Failed to fetch language preference, using default:", error);
        }
        // Keep default language (already set to initialLanguage)
      } finally {
        setIsLoading(false);
      }
    };

    fetchLanguagePreference();
  }, []);

  const contextValue: TranslationContextValue = {
    language,
    translations,
    setLanguage,
    isLoading,
  };

  return <TranslationContext.Provider value={contextValue}>{children}</TranslationContext.Provider>;
}
