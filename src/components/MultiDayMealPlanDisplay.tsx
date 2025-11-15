import type { MultiDayPlanChatData } from "../types";
import { DayPlanCard } from "./DayPlanCard";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface MultiDayMealPlanDisplayProps {
  planData: MultiDayPlanChatData;
}

export function MultiDayMealPlanDisplay({ planData }: MultiDayMealPlanDisplayProps) {
  const { t } = useTranslation();
  const sortedDays = [...planData.days].sort((a, b) => a.day_number - b.day_number);

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 bg-muted/50">
        <h2 className="text-lg font-semibold mb-4">{t("multiDay.summary")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">{t("multiDay.numberOfDays")}</div>
            <div className="text-xl font-bold">{planData.summary.number_of_days}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t("multiDay.averageKcal")}</div>
            <div className="text-xl font-bold">{Math.round(planData.summary.average_kcal)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t("multiDay.averageProteins")}</div>
            <div className="text-xl font-bold">{Math.round(planData.summary.average_proteins)}g</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t("multiDay.averageFats")}</div>
            <div className="text-xl font-bold">{Math.round(planData.summary.average_fats)}g</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t("multiDay.averageCarbs")}</div>
            <div className="text-xl font-bold">{Math.round(planData.summary.average_carbs)}g</div>
          </div>
        </div>
      </div>

      <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
        {sortedDays.map((day) => (
          <DayPlanCard
            key={day.day_number}
            dayNumber={day.day_number}
            planContent={day.plan_content}
            dayName={day.name}
          />
        ))}
      </div>
    </div>
  );
}

