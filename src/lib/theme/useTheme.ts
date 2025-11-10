import { useContext } from "react";
import { ThemeContext } from "./ThemeProvider";
import type { Theme } from "../../types.ts";

/**
 * Custom hook to access theme state and functions.
 * Handles SSR and hydration timing gracefully by providing default theme when context is not available.
 * @returns Theme value, setTheme function, toggleTheme function, and isLoading state
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  // During SSR or if context is not available yet (hydration timing), use default light theme
  // This handles cases where:
  // 1. Component renders during SSR (context not available)
  // 2. Component hydrates before ThemeProvider is ready (Astro client:load timing)
  if (!context) {
    // Fallback: return default light theme with no-op functions
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const setTheme = async (_theme: Theme): Promise<void> => {
      // No-op: provider not available yet
    };
    const toggleTheme = async (): Promise<void> => {
      // No-op: provider not available yet
    };
    return { theme: "light" as const, setTheme, toggleTheme, isLoading: false };
  }

  const { theme, setTheme, toggleTheme, isLoading } = context;

  return { theme, setTheme, toggleTheme, isLoading };
}

