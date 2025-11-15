import type { MealPlanContentDailySummary, MultiDayPlanListItemDto } from "../types";
import { formatRelativeTime } from "../lib/utils/date";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface MealPlanInfoProps {
  name: string;
  createdAt: string;
  updatedAt: string;
  dailySummary?: MealPlanContentDailySummary;
  multiDaySummary?: {
    number_of_days: number;
    average_kcal: number;
    common_exclusions_guidelines?: string | null;
  };
}

/**
 * Displays meal plan name and metadata (creation/update dates) in a readable format.
 * Optionally displays daily summary values (kcal, macros) as preview for single-day plans,
 * or multi-day summary (number of days, average kcal) for multi-day plans.
 */
export function MealPlanInfo({ name, createdAt, updatedAt, dailySummary, multiDaySummary }: MealPlanInfoProps) {
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
      {multiDaySummary ? (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">
                {multiDaySummary.number_of_days} {multiDaySummary.number_of_days === 1 ? t("startup.day") : t("startup.days")}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">{t("summary.avgKcal")}:</span>
              <span className="font-medium">{Math.round(multiDaySummary.average_kcal)}</span>
            </div>
          </div>
          {multiDaySummary.common_exclusions_guidelines && (
            <div className="text-sm">
              <span className="text-muted-foreground font-medium">{t("summary.commonGuidelines")}:</span>
              <p className="text-foreground mt-1 line-clamp-2">{multiDaySummary.common_exclusions_guidelines}</p>
            </div>
          )}
        </div>
      ) : dailySummary ? (
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
      ) : null}
    </div>
  );
}
