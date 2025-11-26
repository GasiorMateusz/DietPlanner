import React from "react";
import { MultiDayPlanView } from "./MultiDayPlanView";
import { TranslationProvider } from "@/lib/i18n/TranslationProvider";

interface MultiDayPlanViewWrapperProps {
  planId: string;
}

export function MultiDayPlanViewWrapper({ planId }: MultiDayPlanViewWrapperProps) {
  return (
    <TranslationProvider>
      <MultiDayPlanView planId={planId} />
    </TranslationProvider>
  );
}
