import type { TypedMealPlanRow } from "../types";
import { DailySummaryStaticDisplay } from "./DailySummaryStaticDisplay";
import { MealCardReadOnly } from "./MealCardReadOnly";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface DayPlanViewProps {
  dayNumber: number;
  dayPlan: TypedMealPlanRow;
}

export function DayPlanView({ dayNumber, dayPlan }: DayPlanViewProps) {
  const { t } = useTranslation();

  return (
    <div className="border rounded-lg p-6 space-y-4 bg-background">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">
          {t("multiDay.day")} {dayNumber}
        </h3>
        {dayPlan.name && <span className="text-sm text-muted-foreground">{dayPlan.name}</span>}
      </div>

      <DailySummaryStaticDisplay summary={dayPlan.plan_content.daily_summary} />

      <div className="space-y-4">
        <h4 className="text-lg font-semibold">{t("chat.meals")}</h4>
        {dayPlan.plan_content.meals.length > 0 ? (
          <div className="space-y-4">
            {dayPlan.plan_content.meals.map((meal, index) => (
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
