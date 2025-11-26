import { useMultiDayPlan } from "./hooks/useMultiDayPlan";
import { PlanSummary } from "./PlanSummary";
import { DaysList } from "./DaysList";
import { ExportButton } from "./ExportButton";
import { EditButton } from "./EditButton";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface MultiDayPlanViewProps {
  planId: string;
}

export function MultiDayPlanView({ planId }: MultiDayPlanViewProps) {
  const { t } = useTranslation();
  const { planData, isLoading, error, refetch } = useMultiDayPlan(planId);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-8 max-w-6xl space-y-6">
        <Skeleton className="h-12 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-8 max-w-6xl">
        <Alert className="border-destructive bg-destructive/10 text-destructive">
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error.message || t("view.loadError")}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {t("common.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!planData) {
    return (
      <div className="container mx-auto p-4 sm:p-8 max-w-6xl">
        <Alert>
          <AlertDescription>{t("view.notFound")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => (window.location.href = "/app/dashboard")} data-testid="back-button">
          {t("common.back")}
        </Button>
        <div className="flex gap-2">
          <ExportButton planId={planData.id} />
          <EditButton planId={planData.id} />
        </div>
      </div>

      <PlanSummary
        name={planData.name}
        number_of_days={planData.number_of_days}
        average_kcal={planData.average_kcal ?? 0}
        average_proteins={planData.average_proteins ?? 0}
        average_fats={planData.average_fats ?? 0}
        average_carbs={planData.average_carbs ?? 0}
        common_exclusions_guidelines={planData.common_exclusions_guidelines}
        common_allergens={planData.common_allergens}
      />

      <div>
        <h2 className="text-2xl font-bold mb-4">{t("multiDay.allDays")}</h2>
        <DaysList days={planData.days} />
      </div>
    </div>
  );
}
