import React from "react";
import AIChatInterface from "./AIChatInterface";
import { TranslationProvider } from "@/lib/i18n/TranslationProvider";

interface AIChatInterfaceWrapperProps {
  planId?: string;
}

export function AIChatInterfaceWrapper({ planId }: AIChatInterfaceWrapperProps) {
  return (
    <TranslationProvider>
      <AIChatInterface editMode={!!planId} existingPlanId={planId} />
    </TranslationProvider>
  );
}
