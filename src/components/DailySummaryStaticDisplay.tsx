import type { MealPlanContentDailySummary } from "../types";

interface DailySummaryProps {
  summary: MealPlanContentDailySummary;
}

/**
 * Read-only display component showing the daily nutritional summary.
 * Displays total kcal, proteins, fats, and carbs for the entire day.
 */
export function DailySummaryStaticDisplay({ summary }: DailySummaryProps) {
  return (
    <div className="border rounded-lg p-4 bg-muted/50">
      <h2 className="text-lg font-semibold mb-4">Daily Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Total Kcal</div>
          <div className="text-2xl font-bold">{summary.kcal}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Proteins</div>
          <div className="text-2xl font-bold">{summary.proteins}g</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Fats</div>
          <div className="text-2xl font-bold">{summary.fats}g</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Carbs</div>
          <div className="text-2xl font-bold">{summary.carbs}g</div>
        </div>
      </div>
    </div>
  );
}
