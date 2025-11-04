import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DailySummaryStaticDisplay } from "@/components/DailySummaryStaticDisplay";
import type { MealPlanContentDailySummary } from "@/types";

describe("DailySummaryStaticDisplay", () => {
  const createMockSummary = (overrides?: Partial<MealPlanContentDailySummary>): MealPlanContentDailySummary => ({
    kcal: 2000,
    proteins: 150,
    fats: 65,
    carbs: 250,
    ...overrides,
  });

  describe("rendering", () => {
    it("should render all nutritional values, labels, and heading correctly", () => {
      const summary = createMockSummary();

      render(<DailySummaryStaticDisplay summary={summary} />);

      // Check heading
      expect(screen.getByRole("heading", { level: 2, name: "Daily Summary" })).toBeInTheDocument();

      // Check labels
      expect(screen.getByText("Total Kcal")).toBeInTheDocument();
      expect(screen.getByText("Proteins")).toBeInTheDocument();
      expect(screen.getByText("Fats")).toBeInTheDocument();
      expect(screen.getByText("Carbs")).toBeInTheDocument();

      // Check values with correct formatting
      expect(screen.getByText("2000")).toBeInTheDocument();
      expect(screen.getByText("150g")).toBeInTheDocument();
      expect(screen.getByText("65g")).toBeInTheDocument();
      expect(screen.getByText("250g")).toBeInTheDocument();
    });

    it("should format values correctly (kcal without unit, macros with 'g')", () => {
      const summary = createMockSummary({ kcal: 2000, proteins: 150, fats: 65, carbs: 250 });

      render(<DailySummaryStaticDisplay summary={summary} />);

      expect(screen.getByText("2000")).toBeInTheDocument();
      expect(screen.queryByText("2000g")).not.toBeInTheDocument();
      expect(screen.getByText("150g")).toBeInTheDocument();
      expect(screen.getByText("65g")).toBeInTheDocument();
      expect(screen.getByText("250g")).toBeInTheDocument();
    });
  });

  describe("zero values", () => {
    it("should display zero values correctly", () => {
      const summary = createMockSummary({
        kcal: 0,
        proteins: 0,
        fats: 0,
        carbs: 0,
      });

      render(<DailySummaryStaticDisplay summary={summary} />);

      expect(screen.getByText("0")).toBeInTheDocument();
      expect(screen.getAllByText("0g")).toHaveLength(3);
    });

    it("should handle mixed zero and non-zero values", () => {
      const summary = createMockSummary({
        kcal: 2000,
        proteins: 0,
        fats: 65,
        carbs: 0,
      });

      render(<DailySummaryStaticDisplay summary={summary} />);

      expect(screen.getByText("2000")).toBeInTheDocument();
      expect(screen.getByText("65g")).toBeInTheDocument();
      expect(screen.getAllByText("0g")).toHaveLength(2);
    });
  });

  describe("edge cases", () => {
    it("should handle large numbers", () => {
      const summary = createMockSummary({
        kcal: 5000,
        proteins: 300,
        fats: 150,
        carbs: 500,
      });

      render(<DailySummaryStaticDisplay summary={summary} />);

      expect(screen.getByText("5000")).toBeInTheDocument();
      expect(screen.getByText("300g")).toBeInTheDocument();
      expect(screen.getByText("150g")).toBeInTheDocument();
      expect(screen.getByText("500g")).toBeInTheDocument();
    });

    it("should handle decimal values", () => {
      const summary = createMockSummary({
        kcal: 1999.5,
        proteins: 149.8,
        fats: 64.9,
        carbs: 249.3,
      });

      render(<DailySummaryStaticDisplay summary={summary} />);

      expect(screen.getByText("1999.5")).toBeInTheDocument();
      expect(screen.getByText("149.8g")).toBeInTheDocument();
      expect(screen.getByText("64.9g")).toBeInTheDocument();
      expect(screen.getByText("249.3g")).toBeInTheDocument();
    });

    it("should handle very small values", () => {
      const summary = createMockSummary({
        kcal: 1,
        proteins: 1,
        fats: 1,
        carbs: 1,
      });

      render(<DailySummaryStaticDisplay summary={summary} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getAllByText("1g")).toHaveLength(3);
    });

    it("should handle negative values", () => {
      const summary = createMockSummary({
        kcal: -100,
        proteins: -50,
        fats: -25,
        carbs: -75,
      });

      render(<DailySummaryStaticDisplay summary={summary} />);

      expect(screen.getByText("-100")).toBeInTheDocument();
      expect(screen.getByText("-50g")).toBeInTheDocument();
      expect(screen.getByText("-25g")).toBeInTheDocument();
      expect(screen.getByText("-75g")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper heading hierarchy", () => {
      const summary = createMockSummary();

      render(<DailySummaryStaticDisplay summary={summary} />);

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("Daily Summary");
    });

    it("should have proper container structure", () => {
      const summary = createMockSummary();

      const { container } = render(<DailySummaryStaticDisplay summary={summary} />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toBeInTheDocument();
      expect(mainDiv.tagName).toBe("DIV");
      expect(container.querySelector(".grid")).toBeInTheDocument();
    });
  });
});
