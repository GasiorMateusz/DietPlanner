import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Trim whitespace and enforce max length (100 chars per API schema)
    const trimmedValue = value.trim().slice(0, 100);
    onSearchChange(trimmedValue);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <Button onClick={onCreateClick} className="w-full sm:w-auto" data-testid="dashboard-create-meal-plan-button">
        Create new meal plan
      </Button>
      <div className="flex-1">
        <Input
          type="text"
          placeholder="Search meal plans..."
          value={searchValue}
          onChange={handleSearchInputChange}
          maxLength={100}
          className="w-full"
          aria-label="Search meal plans by name"
          data-testid="dashboard-search-input"
        />
      </div>
    </div>
  );
}
