import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface EmptyStateProps {
  onCreateClick?: () => void;
}

/**
 * Empty state component displayed when the user has no saved meal plans.
 * Provides visual guidance to create the first plan.
 */
export function EmptyState({ onCreateClick }: EmptyStateProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mx-auto max-w-md">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">{t("dashboard.emptyState.title")}</h2>
        <p className="text-muted-foreground mb-6">{t("dashboard.emptyState.description")}</p>
        {onCreateClick && (
          <Button onClick={onCreateClick} className="w-full sm:w-auto">
            {t("dashboard.emptyState.createButton")}
          </Button>
        )}
      </div>
    </div>
  );
}
