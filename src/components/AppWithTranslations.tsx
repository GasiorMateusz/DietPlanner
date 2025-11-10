import React, { type ReactNode } from "react";
import { TranslationProvider } from "@/lib/i18n/TranslationProvider";
import { NavBar } from "@/components/NavBar";

interface AppWithTranslationsProps {
  children: ReactNode;
  userEmail?: string;
}

/**
 * Wrapper component that provides translation context to the entire app.
 * This ensures the TranslationProvider and NavBar are in the same React tree.
 */
export function AppWithTranslations({ children, userEmail }: AppWithTranslationsProps) {
  return (
    <TranslationProvider>
      <NavBar userEmail={userEmail} />
      <main>{children}</main>
    </TranslationProvider>
  );
}

