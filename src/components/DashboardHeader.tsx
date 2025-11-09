import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface DashboardHeaderProps {
  onCreateClick: () => void;
  onSearchChange: (searchQuery: string) => void;
  searchValue: string;
}

/**
 * Header component for the Dashboard view.
 * Contains the "Create new meal plan" button and search input field.
 */
export function DashboardHeader({ onCreateClick, onSearchChange, searchValue }: DashboardHeaderProps) {
  const { t } = useTranslation();
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Trim whitespace and enforce max length (100 chars per API schema)
    const trimmedValue = value.trim().slice(0, 100);
    onSearchChange(trimmedValue);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <Button onClick={onCreateClick} className="w-full sm:w-auto" data-testid="dashboard-create-meal-plan-button">
        {t("dashboard.createPlan")}
      </Button>
      <div className="flex-1">
        <Input
          type="text"
          placeholder={t("dashboard.searchPlaceholder")}
          value={searchValue}
          onChange={handleSearchInputChange}
          maxLength={100}
          className="w-full"
          aria-label={t("dashboard.searchPlaceholder")}
          data-testid="dashboard-search-input"
        />
      </div>
    </div>
  );
}
