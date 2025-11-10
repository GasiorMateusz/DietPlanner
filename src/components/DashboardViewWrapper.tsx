import React from "react";
import DashboardView from "./DashboardView";
import { TranslationProvider } from "@/lib/i18n/TranslationProvider";

/**
 * Wrapper component that provides translation context to DashboardView.
 * This ensures DashboardView can access translations even though it's in a separate React island.
 */
export function DashboardViewWrapper() {
  return (
    <TranslationProvider>
      <DashboardView />
    </TranslationProvider>
  );
}

