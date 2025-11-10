import React, { createContext, useEffect, useState, useMemo, useCallback, useRef, type ReactNode } from "react";
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
  const languageRef = useRef<LanguageCode>(initialLanguage);

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
        // Update ref immediately
        languageRef.current = newLanguage;
        // Dispatch custom event for same-tab sync
        window.dispatchEvent(new CustomEvent("languagechange", { detail: newLanguage }));

        return newLanguage;
      });

      // Save preference asynchronously (don't block the state update)
      // Only save if language actually changed
      if (previousLanguage !== null && previousLanguage !== newLanguage) {
        try {
          // Check if user is authenticated before calling API to avoid redirect
          const { getAuthToken } = await import("@/lib/auth/get-auth-token");
          const token = await getAuthToken();
          // Only call API if user is authenticated
          if (token) {
            await userPreferencesApi.updateLanguagePreference({ language: newLanguage });
          }
          // If no token, that's fine - language is stored in localStorage for the session
        } catch (error) {
          // Ignore all errors - language change is stored in localStorage anyway
          // This prevents redirects on auth pages
          // The error might be from getAuthToken or the API call, but we don't want to redirect
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.warn("Failed to persist language preference (stored in localStorage only):", error);
          }
        }
      }
    },
    [] // No dependencies - uses functional update
  );

  // Update ref when language state changes
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // Sync language state with localStorage and other provider instances
  useEffect(() => {
    const syncLanguage = () => {
      const storedLanguage = localStorage.getItem("app-language") as LanguageCode | null;
      if (storedLanguage && (storedLanguage === "en" || storedLanguage === "pl")) {
        if (storedLanguage !== languageRef.current) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log("[TranslationProvider] Polling detected language change:", storedLanguage);
          }
          languageRef.current = storedLanguage;
          setLanguageState(storedLanguage);
        }
      }
    };

    // Check localStorage on mount
    syncLanguage();

    // Poll localStorage periodically to catch same-tab changes
    // (storage events only fire for cross-tab changes)
    // Use a faster interval for better responsiveness
    const pollInterval = setInterval(() => {
      syncLanguage();
    }, 100); // Check every 100ms for better responsiveness

    // Listen for language changes from other provider instances (cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "app-language") {
        const newLanguage = e.newValue as LanguageCode | null;
        if (newLanguage && (newLanguage === "en" || newLanguage === "pl") && newLanguage !== languageRef.current) {
          setLanguageState(newLanguage);
          languageRef.current = newLanguage;
        }
      }
    };

    // Listen for custom language change events (for same-tab sync)
    // Use ref to avoid dependency on language state
    const handleLanguageChange = (e: CustomEvent<LanguageCode>) => {
      const newLanguage = e.detail;
      if (newLanguage && (newLanguage === "en" || newLanguage === "pl") && newLanguage !== languageRef.current) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log("[TranslationProvider] Language change event received:", newLanguage);
        }
        // Update immediately for instant UI feedback
        languageRef.current = newLanguage;
        setLanguageState(newLanguage);
        // Also update localStorage to keep in sync
        localStorage.setItem("app-language", newLanguage);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("languagechange", handleLanguageChange as EventListener);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("languagechange", handleLanguageChange as EventListener);
    };
  }, []); // Empty deps - use refs to avoid recreating listeners

  // Fetch user language preference on mount
  // Priority: localStorage > API > initialLanguage
  useEffect(() => {
    const fetchLanguagePreference = async () => {
      try {
        setIsLoading(true);
        // Check localStorage first (for unauthenticated users or quick language switching)
        const storedLanguage = localStorage.getItem("app-language") as LanguageCode | null;
        if (storedLanguage && (storedLanguage === "en" || storedLanguage === "pl")) {
          // Use localStorage value immediately
          setLanguageState(storedLanguage);
        }

        // Try to fetch from API (for authenticated users)
        try {
          const preference = await userPreferencesApi.getLanguagePreference();
          // Only update if different from localStorage (API is source of truth for authenticated users)
          if (preference.language !== storedLanguage) {
            setLanguageState(preference.language);
            localStorage.setItem("app-language", preference.language);
          }
        } catch {
          // API call failed (user not authenticated or network error)
          // If we have a storedLanguage, keep it (user might be unauthenticated but had a preference)
          if (!storedLanguage) {
            // No stored language and API failed - use initialLanguage
            setLanguageState(initialLanguage);
            localStorage.setItem("app-language", initialLanguage);
          }
          // If we have storedLanguage, we already set it above, so no need to override
        }
      } catch (error) {
        // Fallback to initialLanguage if everything fails
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn("Failed to initialize language preference, using default:", error);
        }
        setLanguageState(initialLanguage);
        localStorage.setItem("app-language", initialLanguage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLanguagePreference();
  }, [initialLanguage]);

  // Memoize context value to ensure React detects changes and triggers re-renders
  const contextValue: TranslationContextValue = useMemo(() => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log("[TranslationProvider] Context value updated, language:", language);
    }
    return {
      language,
      translations,
      setLanguage,
      isLoading,
    };
  }, [language, translations, setLanguage, isLoading]);

  return <TranslationContext.Provider value={contextValue}>{children}</TranslationContext.Provider>;
}
