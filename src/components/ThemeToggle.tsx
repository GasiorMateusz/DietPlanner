import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme/useTheme";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { Theme } from "@/types";

interface ThemeToggleProps {
  className?: string;
}

/**
 * Theme toggle component that allows users to switch between light and dark themes.
 * Displays sun icon in dark mode (clicking switches to light) and moon icon in light mode (clicking switches to dark).
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme, isLoading } = useTheme();
  const { t } = useTranslation();
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localTheme, setLocalTheme] = useState<Theme>(theme);

  // Sync local theme with context theme
  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  // Handle theme toggle
  const handleToggle = async () => {
    if (isToggling || isLoading) {
      return;
    }

    const newTheme: Theme = localTheme === "light" ? "dark" : "light";

    // Update local state immediately for instant UI feedback
    setLocalTheme(newTheme);
    setError(null);
    setIsToggling(true);

    // Update theme preference asynchronously
    try {
      await toggleTheme();
    } catch (err) {
      // Revert local state on error
      setLocalTheme(theme);
      const errorMessage = err instanceof Error ? err.message : "Failed to toggle theme";
      setError(errorMessage);
      // eslint-disable-next-line no-console
      console.error("Error toggling theme:", err);
    } finally {
      setIsToggling(false);
    }
  };

  // Determine icon and aria label based on current theme
  // When in dark mode, show sun icon (clicking switches to light)
  // When in light mode, show moon icon (clicking switches to dark)
  const Icon = localTheme === "dark" ? Sun : Moon;
  const ariaLabel = localTheme === "dark" ? t("nav.theme.switchToLight") : t("nav.theme.switchToDark");

  return (
    <div className={className}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        disabled={isToggling || isLoading}
        aria-label={ariaLabel}
        className="h-9 w-9"
      >
        <Icon className="h-5 w-5" />
      </Button>
      {error && (
        <p className="mt-1 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

