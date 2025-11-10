import React, { createContext, useEffect, useState, useMemo, useCallback, type ReactNode } from "react";
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

  // Load translations based on current language - memoized to prevent unnecessary recalculations
  const translations: Translations = useMemo(() => (language === "pl" ? plTranslations : enTranslations), [language]);

  /**
   * Updates the language state and persists to database.
   * This function is exposed via context for components to update language.
   * Memoized to prevent unnecessary re-renders of consuming components.
   */
  const setLanguage = useCallback(
    async (newLanguage: LanguageCode): Promise<void> => {
      // Use functional update to get current language value
      let previousLanguage: LanguageCode | null = null;
      setLanguageState((currentLanguage) => {
        // Store previous language for potential revert
        previousLanguage = currentLanguage;

        if (newLanguage === currentLanguage) {
          return currentLanguage;
        }

        // Store in localStorage for cross-island sync
        localStorage.setItem("app-language", newLanguage);
        // Dispatch custom event for same-tab sync
        window.dispatchEvent(new CustomEvent("languagechange", { detail: newLanguage }));

        return newLanguage;
      });

      // Save preference asynchronously (don't block the state update)
      // Only save if language actually changed
      if (previousLanguage !== null && previousLanguage !== newLanguage) {
        try {
          await userPreferencesApi.updateLanguagePreference({ language: newLanguage });
        } catch (error) {
          // Revert on error
          if (import.meta.env.DEV) {
            console.error("Failed to persist language preference, reverting:", error);
          }
          setLanguageState(previousLanguage);
          localStorage.setItem("app-language", previousLanguage);
        }
      }
    },
    [] // No dependencies - uses functional update
  );

  // Sync language state with localStorage and other provider instances
  useEffect(() => {
    const syncLanguage = () => {
      const storedLanguage = localStorage.getItem("app-language") as LanguageCode | null;
      if (storedLanguage && (storedLanguage === "en" || storedLanguage === "pl")) {
        if (storedLanguage !== language) {
          setLanguageState(storedLanguage);
        }
      }
    };

    // Check localStorage on mount
    syncLanguage();

    // Listen for language changes from other provider instances
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "app-language") {
        const newLanguage = e.newValue as LanguageCode | null;
        if (newLanguage && (newLanguage === "en" || newLanguage === "pl") && newLanguage !== language) {
          setLanguageState(newLanguage);
        }
      }
    };

    // Listen for custom language change events (for same-tab sync)
    const handleLanguageChange = (e: CustomEvent<LanguageCode>) => {
      if (e.detail !== language) {
        setLanguageState(e.detail);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("languagechange", handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("languagechange", handleLanguageChange as EventListener);
    };
  }, [language]);

  // Fetch user language preference on mount
  useEffect(() => {
    const fetchLanguagePreference = async () => {
      try {
        setIsLoading(true);
        const preference = await userPreferencesApi.getLanguagePreference();
        setLanguageState(preference.language);
        // Store in localStorage for cross-island sync
        localStorage.setItem("app-language", preference.language);
      } catch (error) {
        // If API call fails (e.g., user not authenticated, network error),
        // fall back to default language
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn("Failed to fetch language preference, using default:", error);
        }
        // Keep default language (already set to initialLanguage)
        localStorage.setItem("app-language", initialLanguage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLanguagePreference();
  }, [initialLanguage]);

  // Memoize context value to ensure React detects changes and triggers re-renders
  const contextValue: TranslationContextValue = useMemo(
    () => ({
      language,
      translations,
      setLanguage,
      isLoading,
    }),
    [language, translations, setLanguage, isLoading]
  );

  return <TranslationContext.Provider value={contextValue}>{children}</TranslationContext.Provider>;
}
