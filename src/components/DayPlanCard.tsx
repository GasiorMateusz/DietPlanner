import type { MealPlanContent } from "../types";
import { DailySummaryStaticDisplay } from "./DailySummaryStaticDisplay";
import { MealCardReadOnly } from "./MealCardReadOnly";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface DayPlanCardProps {
  dayNumber: number;
  planContent: MealPlanContent;
  dayName?: string;
}

export function DayPlanCard({ dayNumber, planContent, dayName }: DayPlanCardProps) {
  const { t } = useTranslation();

  return (
    <div className="border rounded-lg p-6 space-y-4 bg-background">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">
          {t("multiDay.day")} {dayNumber}
        </h3>
        {dayName && <span className="text-sm text-muted-foreground">{dayName}</span>}
      </div>

      <DailySummaryStaticDisplay summary={planContent.daily_summary} />

      <div className="space-y-4">
        <h4 className="text-lg font-semibold">{t("chat.meals")}</h4>
        {planContent.meals.length > 0 ? (
          <div className="space-y-4">
            {planContent.meals.map((meal, index) => (
              <MealCardReadOnly key={index} meal={meal} mealIndex={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">{t("chat.noMeals")}</div>
        )}
      </div>
    </div>
  );
}

