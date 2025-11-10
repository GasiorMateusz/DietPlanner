import { useContext, useState, useEffect } from "react";
import { TranslationContext } from "./TranslationProvider";
import type { TranslationKey, LanguageCode } from "./types";
import enTranslations from "./translations/en.json";
import plTranslations from "./translations/pl.json";

/**
 * Custom hook to access translations and current language.
 * Handles SSR and hydration timing gracefully by providing default translations when context is not available.
 * Also handles Astro islands where context might not be available by syncing with localStorage and events.
 * @returns Translation function and current language code
 */
export function useTranslation() {
  const context = useContext(TranslationContext);

  // State for language when context is not available (Astro islands)
  // Always start with "en" to match server render and avoid hydration mismatch
  // Then sync with localStorage after hydration completes
  const [localLanguage, setLocalLanguage] = useState<LanguageCode>("en");
  const [hasHydrated, setHasHydrated] = useState(false);

  // Sync with localStorage when context is not available (for Astro islands)
  // Use useEffect (not useLayoutEffect) to ensure it runs AFTER React has finished hydrating
  // This prevents hydration mismatches by ensuring the first render always uses "en"
  useEffect(() => {
    if (context) {
      // Context is available, no need to sync with localStorage
      return;
    }

    let pollInterval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    // Mark as hydrated after the first effect runs (which is after React finishes hydration)
    // Use a small timeout to ensure React has completely finished the hydration comparison
    timeoutId = setTimeout(() => {
      setHasHydrated(true);

      // Sync with localStorage after hydration is complete
      const syncLanguage = () => {
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("app-language") as LanguageCode | null;
          if (stored && (stored === "en" || stored === "pl")) {
            setLocalLanguage((current) => {
              if (stored !== current) {
                return stored;
              }
              return current;
            });
          }
        }
      };

      // Sync immediately
      syncLanguage();

      // Listen for language change events
      const handleLanguageChange = (e: CustomEvent<LanguageCode>) => {
        if (e.detail && (e.detail === "en" || e.detail === "pl")) {
          setLocalLanguage((current) => {
            if (e.detail !== current) {
              return e.detail;
            }
            return current;
          });
        }
      };

      // Poll localStorage for changes (since storage events don't fire for same-tab changes)
      pollInterval = setInterval(syncLanguage, 100);

      window.addEventListener("languagechange", handleLanguageChange as EventListener);
    }, 0);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      // Note: We can't remove the event listener here because it's added inside the timeout
      // This is acceptable as the component will unmount anyway
    };
  }, [context]); // Only depend on context to avoid recreating the effect

  // During SSR or if context is not available yet (hydration timing or Astro islands)
  if (!context) {
    // During SSR or before hydration completes, always use English to match server render
    // After hydration, use localLanguage which syncs with localStorage
    // This ensures server and client render the same HTML initially, preventing hydration errors
    const currentLanguage = hasHydrated ? localLanguage : "en";
    const translations = currentLanguage === "pl" ? plTranslations : enTranslations;

    const t = (key: TranslationKey): string => {
      const translation = translations[key];
      if (!translation) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn(`Missing translation for key: ${key}`);
        }
        return key;
      }
      return translation;
    };

    const setLanguage = async (_language: LanguageCode): Promise<void> => {
      // Update localStorage and dispatch event
      if (typeof window !== "undefined") {
        localStorage.setItem("app-language", _language);
        window.dispatchEvent(new CustomEvent("languagechange", { detail: _language }));
        setLocalLanguage(_language);
      }
    };

    return { t, language: currentLanguage, setLanguage };
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
