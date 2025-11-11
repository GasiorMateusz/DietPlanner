import React, { createContext, useEffect, useState, useMemo, useCallback, type ReactNode } from "react";
import type { Theme } from "../../types.ts";
import { userPreferencesApi } from "@/lib/api/user-preferences.client";
import { getAuthToken } from "@/lib/auth/get-auth-token";

/**
 * Theme context value type.
 */
interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  toggleTheme: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Theme context.
 */
export const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Props for ThemeProvider component.
 */
interface ThemeProviderProps {
  children: ReactNode;
  /**
   * Initial theme to use before fetching user preference.
   * Defaults to "light".
   */
  initialTheme?: Theme;
}

/**
 * Theme provider component that manages theme state.
 * Fetches user theme preference on mount and provides theme context to children.
 * Applies theme class to <html> element for Tailwind dark mode.
 */
export function ThemeProvider({ children, initialTheme = "light" }: ThemeProviderProps) {
  // Initialize theme from localStorage (most current), DOM (set by server-side script), or initialTheme
  const getInitialTheme = (): Theme => {
    if (typeof window !== "undefined") {
      // First, check localStorage (most current source of truth)
      const storedTheme = localStorage.getItem("app-theme") as Theme | null;
      if (storedTheme && (storedTheme === "light" || storedTheme === "dark")) {
        return storedTheme;
      }

      // If no localStorage, check if HTML element has dark class (set by server-side script)
      const htmlElement = document.documentElement;
      const hasDarkClass = htmlElement.classList.contains("dark");
      if (hasDarkClass) {
        return "dark";
      }
    }
    return initialTheme;
  };

  const [theme, setThemeState] = useState<Theme>(getInitialTheme());
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Applies theme class to <html> element.
   * Adds "dark" class for dark theme, removes it for light theme.
   */
  const applyThemeToDOM = useCallback((newTheme: Theme) => {
    if (typeof document !== "undefined") {
      const htmlElement = document.documentElement;
      if (newTheme === "dark") {
        htmlElement.classList.add("dark");
      } else {
        htmlElement.classList.remove("dark");
      }
    }
  }, []);

  /**
   * Updates the theme state and persists to database.
   * This function is exposed via context for components to update theme.
   * Memoized to prevent unnecessary re-renders of consuming components.
   */
  const setTheme = useCallback(
    async (newTheme: Theme): Promise<void> => {
      // Use functional update to get current theme value
      let previousTheme: Theme | null = null;
      setThemeState((currentTheme) => {
        // Store previous theme for potential revert
        previousTheme = currentTheme;

        if (newTheme === currentTheme) {
          return currentTheme;
        }

        // Apply theme to DOM immediately
        applyThemeToDOM(newTheme);
        // Store in localStorage for cross-island sync
        localStorage.setItem("app-theme", newTheme);
        // Dispatch custom event for same-tab sync
        window.dispatchEvent(new CustomEvent("themechange", { detail: newTheme }));

        return newTheme;
      });

      // Save preference asynchronously (don't block the state update)
      // Only save if theme actually changed
      if (previousTheme !== null && previousTheme !== newTheme) {
        try {
          // Only sync to API if user is authenticated (prevents redirect loops on auth pages)
          const token = await getAuthToken();
          if (token) {
            await userPreferencesApi.updateThemePreference({ theme: newTheme });
          }
          // If not authenticated, skip API sync (localStorage is source of truth)
        } catch (error) {
          // Log error but don't revert - localStorage is source of truth
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.warn("Failed to persist theme preference, keeping local change:", error);
          }
        }
      }
    },
    [applyThemeToDOM]
  );

  /**
   * Toggles between light and dark themes.
   */
  const toggleTheme = useCallback(async (): Promise<void> => {
    const newTheme: Theme = theme === "light" ? "dark" : "light";
    await setTheme(newTheme);
  }, [theme, setTheme]);

  // Sync theme state with localStorage and other provider instances
  useEffect(() => {
    // Listen for theme changes from other provider instances
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "app-theme") {
        const newTheme = e.newValue as Theme | null;
        if (newTheme && (newTheme === "light" || newTheme === "dark") && newTheme !== theme) {
          setThemeState(newTheme);
          applyThemeToDOM(newTheme);
        }
      }
    };

    // Listen for custom theme change events (for same-tab sync)
    const handleThemeChange = (e: CustomEvent<Theme>) => {
      if (e.detail !== theme) {
        setThemeState(e.detail);
        applyThemeToDOM(e.detail);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("themechange", handleThemeChange as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("themechange", handleThemeChange as EventListener);
    };
  }, [theme, applyThemeToDOM]);

  // Apply initial theme to DOM on mount
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [applyThemeToDOM, theme]);

  // Fetch user theme preference on mount (only sync, don't override localStorage)
  useEffect(() => {
    const fetchThemePreference = async () => {
      try {
        setIsLoading(true);
        const preference = await userPreferencesApi.getThemePreference();

        // Get current theme from localStorage (source of truth for UI)
        const currentLocalTheme = localStorage.getItem("app-theme") as Theme | null;
        const isValidLocalTheme = currentLocalTheme && (currentLocalTheme === "light" || currentLocalTheme === "dark");

        // localStorage is the source of truth - only use API if localStorage is empty
        if (!isValidLocalTheme) {
          // No localStorage value - use API value
          if (preference.theme !== theme) {
            setThemeState(preference.theme);
            applyThemeToDOM(preference.theme);
            localStorage.setItem("app-theme", preference.theme);
          }
        } else {
          // localStorage has a value - keep it and sync to API if different
          // Only sync to API if user is authenticated (prevents redirect loops on auth pages)
          if (preference.theme !== currentLocalTheme) {
            // Check if user is authenticated before attempting to sync
            const token = await getAuthToken();
            if (token) {
              // Sync localStorage to API in background (don't block UI)
              userPreferencesApi.updateThemePreference({ theme: currentLocalTheme }).catch(() => {
                // Silent fail - localStorage is source of truth
              });
            }
            // If not authenticated, skip API sync (localStorage is source of truth)
          }
          // Ensure DOM and state match localStorage
          if (currentLocalTheme !== theme) {
            setThemeState(currentLocalTheme);
          }
          applyThemeToDOM(currentLocalTheme);
        }
      } catch {
        // If API call fails (e.g., user not authenticated, network error),
        // use localStorage or default theme - don't change anything
        const storedTheme = localStorage.getItem("app-theme") as Theme | null;
        const fallbackTheme =
          storedTheme && (storedTheme === "light" || storedTheme === "dark") ? storedTheme : initialTheme;

        // Only update if different from current state
        if (fallbackTheme !== theme) {
          setThemeState(fallbackTheme);
          applyThemeToDOM(fallbackTheme);
          if (!storedTheme) {
            localStorage.setItem("app-theme", fallbackTheme);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchThemePreference();
  }, [initialTheme, applyThemeToDOM, theme]);

  // Memoize context value to ensure React detects changes and triggers re-renders
  const contextValue: ThemeContextValue = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      isLoading,
    }),
    [theme, setTheme, toggleTheme, isLoading]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}
