import { useTranslation } from "@/lib/i18n/useTranslation";

interface PlanSummaryProps {
  name: string;
  number_of_days: number;
  average_kcal: number;
  average_proteins: number;
  average_fats: number;
  average_carbs: number;
  common_exclusions_guidelines: string | null;
  common_allergens: string[] | null;
}

export function PlanSummary({
  name,
  number_of_days,
  average_kcal,
  average_proteins,
  average_fats,
  average_carbs,
  common_exclusions_guidelines,
  common_allergens,
}: PlanSummaryProps) {
  const { t } = useTranslation();

  return (
    <div className="border rounded-lg p-6 bg-muted/50 space-y-4">
      <div>
        <h1 className="text-3xl font-bold mb-2">{name}</h1>
        <p className="text-muted-foreground">
          {number_of_days} {number_of_days === 1 ? t("startup.day") : t("startup.days")}
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">{t("multiDay.averageMacros")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">{t("summary.totalKcal")}</div>
            <div className="text-2xl font-bold">{Math.round(average_kcal)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t("summary.proteins")}</div>
            <div className="text-2xl font-bold">{Math.round(average_proteins)}g</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t("summary.fats")}</div>
            <div className="text-2xl font-bold">{Math.round(average_fats)}g</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t("summary.carbs")}</div>
            <div className="text-2xl font-bold">{Math.round(average_carbs)}g</div>
          </div>
        </div>
      </div>

      {common_exclusions_guidelines && (
        <div>
          <h2 className="text-lg font-semibold mb-2">{t("multiDay.commonGuidelines")}</h2>
          <p className="text-sm whitespace-pre-wrap">{common_exclusions_guidelines}</p>
        </div>
      )}

      {common_allergens && common_allergens.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">{t("multiDay.commonAllergens")}</h2>
          <p className="text-sm">{common_allergens.join(", ")}</p>
        </div>
      )}
    </div>
  );
}

