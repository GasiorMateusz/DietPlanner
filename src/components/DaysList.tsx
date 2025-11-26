import type { MultiDayPlanViewData } from "../types";
import { DayPlanView } from "./DayPlanView";

interface DaysListProps {
  days: {
    day_number: number;
    day_plan: MultiDayPlanViewData["days"][0]["day_plan"];
  }[];
  viewMode?: "scroll" | "tabs";
}

export function DaysList({ days, viewMode = "scroll" }: DaysListProps) {
  const sortedDays = [...days].sort((a, b) => a.day_number - b.day_number);
  const containerClass = viewMode === "tabs" ? "space-y-6" : "space-y-6 max-h-[800px] overflow-y-auto pr-2";

  return (
    <div className={containerClass}>
      {sortedDays.map((day) => (
        <DayPlanView key={day.day_number} dayNumber={day.day_number} dayPlan={day.day_plan} />
      ))}
    </div>
  );
}
