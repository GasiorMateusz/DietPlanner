import React, { createContext, useEffect, useState, useMemo, useCallback, type ReactNode } from "react";
import type { Theme } from "../../types.ts";
import { userPreferencesApi } from "@/lib/api/user-preferences.client";

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
  const [theme, setThemeState] = useState<Theme>(initialTheme);
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
          await userPreferencesApi.updateThemePreference({ theme: newTheme });
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
    const syncTheme = () => {
      const storedTheme = localStorage.getItem("app-theme") as Theme | null;
      if (storedTheme && (storedTheme === "light" || storedTheme === "dark")) {
        if (storedTheme !== theme) {
          setThemeState(storedTheme);
          applyThemeToDOM(storedTheme);
        }
      }
    };

    // Check localStorage on mount
    syncTheme();

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

  // Fetch user theme preference on mount
  useEffect(() => {
    const fetchThemePreference = async () => {
      try {
        setIsLoading(true);
        const preference = await userPreferencesApi.getThemePreference();
        setThemeState(preference.theme);
        applyThemeToDOM(preference.theme);
        // Store in localStorage for cross-island sync
        localStorage.setItem("app-theme", preference.theme);
      } catch (error) {
        // If API call fails (e.g., user not authenticated, network error),
        // fall back to localStorage or default theme
        const storedTheme = localStorage.getItem("app-theme") as Theme | null;
        const fallbackTheme = storedTheme && (storedTheme === "light" || storedTheme === "dark") 
          ? storedTheme 
          : initialTheme;
        
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn("Failed to fetch theme preference, using fallback:", error);
        }
        setThemeState(fallbackTheme);
        applyThemeToDOM(fallbackTheme);
        localStorage.setItem("app-theme", fallbackTheme);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThemePreference();
  }, [initialTheme, applyThemeToDOM]);

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

