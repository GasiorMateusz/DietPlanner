import type { MealPlanContentDailySummary } from "../types";
import { formatRelativeTime } from "../lib/utils/date";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface MealPlanInfoProps {
  name: string;
  createdAt: string;
  updatedAt: string;
  dailySummary?: MealPlanContentDailySummary;
}

/**
 * Displays meal plan name and metadata (creation/update dates) in a readable format.
 * Optionally displays daily summary values (kcal, macros) as preview.
 */
export function MealPlanInfo({ name, createdAt, updatedAt, dailySummary }: MealPlanInfoProps) {
  const { t } = useTranslation();
  return (
    <div className="flex-1 min-w-0">
      <h3 className="text-lg font-semibold text-foreground mb-1 truncate">{name}</h3>
      <div className="text-sm text-muted-foreground space-y-1">
        <div>
          {t("time.updated")} {formatRelativeTime(updatedAt, t)}
        </div>
        {createdAt !== updatedAt && (
          <div>
            {t("time.created")} {formatRelativeTime(createdAt, t)}
          </div>
        )}
      </div>
      {dailySummary && (
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">{t("summary.kcal")}:</span>
            <span className="font-medium">{dailySummary.kcal}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">{t("summary.proteins")}:</span>
            <span className="font-medium">{dailySummary.proteins}g</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">{t("summary.fats")}:</span>
            <span className="font-medium">{dailySummary.fats}g</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">{t("summary.carbs")}:</span>
            <span className="font-medium">{dailySummary.carbs}g</span>
          </div>
        </div>
      )}
    </div>
  );
}
