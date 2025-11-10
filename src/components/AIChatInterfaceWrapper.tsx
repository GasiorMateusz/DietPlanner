import React from "react";
import AIChatInterface from "./AIChatInterface";
import { TranslationProvider } from "@/lib/i18n/TranslationProvider";

/**
 * Wrapper component that provides translation context to AIChatInterface.
 * This ensures AIChatInterface can access translations even though it's in a separate React island.
 */
export function AIChatInterfaceWrapper() {
  return (
    <TranslationProvider>
      <AIChatInterface />
    </TranslationProvider>
  );
}

