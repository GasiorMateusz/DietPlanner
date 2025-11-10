import React, { type ReactNode } from "react";
import { TranslationProvider } from "@/lib/i18n/TranslationProvider";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { NavBar } from "@/components/NavBar";

interface AppWithTranslationsProps {
  children: ReactNode;
  userEmail?: string;
}

/**
 * Wrapper component that provides translation and theme context to the entire app.
 * This ensures the TranslationProvider, ThemeProvider, and NavBar are in the same React tree.
 */
export function AppWithTranslations({ children, userEmail }: AppWithTranslationsProps) {
  return (
    <ThemeProvider>
      <TranslationProvider>
        <NavBar userEmail={userEmail} />
        <main>{children}</main>
      </TranslationProvider>
    </ThemeProvider>
  );
}
