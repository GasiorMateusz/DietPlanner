import { useState, useCallback } from "react";
import { multiDayPlansApi } from "@/lib/api/multi-day-plans.client";
import type { ExportOptions } from "@/types";

interface UseMultiDayPlanExportReturn {
  exportPlan: (options: ExportOptions) => Promise<void>;
  isExporting: boolean;
  error: Error | null;
}

export function useMultiDayPlanExport(planId: string): UseMultiDayPlanExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportPlan = useCallback(
    async (options: ExportOptions) => {
      setIsExporting(true);
      setError(null);

      try {
        const { blob, filename } = await multiDayPlansApi.export(planId, options);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        const errorMessage = err instanceof Error ? err : new Error("Failed to export plan");
        setError(errorMessage);
        throw errorMessage;
      } finally {
        setIsExporting(false);
      }
    },
    [planId]
  );

  return { exportPlan, isExporting, error };
}
