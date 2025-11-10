import type { MealPlanContentDailySummary } from "../types";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface DailySummaryProps {
  summary: MealPlanContentDailySummary;
}

/**
 * Read-only display component showing the daily nutritional summary.
 * Displays total kcal, proteins, fats, and carbs for the entire day.
 */
export function DailySummaryStaticDisplay({ summary }: DailySummaryProps) {
  const { t } = useTranslation();
  return (
    <div className="border rounded-lg p-4 bg-muted/50">
      <h2 className="text-lg font-semibold mb-4">{t("summary.dailySummary")}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-sm text-muted-foreground">{t("summary.totalKcal")}</div>
          <div className="text-2xl font-bold">{summary.kcal}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">{t("summary.proteins")}</div>
          <div className="text-2xl font-bold">{summary.proteins}g</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">{t("summary.fats")}</div>
          <div className="text-2xl font-bold">{summary.fats}g</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">{t("summary.carbs")}</div>
          <div className="text-2xl font-bold">{summary.carbs}g</div>
        </div>
      </div>
    </div>
  );
}
