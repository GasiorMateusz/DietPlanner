import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DailySummaryStaticDisplay } from '@/components/DailySummaryStaticDisplay';
import type { MealPlanContentDailySummary } from '@/types';

describe('DailySummaryStaticDisplay', () => {
  const createMockSummary = (
    overrides?: Partial<MealPlanContentDailySummary>
  ): MealPlanContentDailySummary => ({
    kcal: 2000,
    proteins: 150,
    fats: 65,
    carbs: 250,
    ...overrides,
  });

  describe('rendering all nutritional values', () => {
    it('should render all four nutritional values', () => {
      const summary = createMockSummary();

      render(<DailySummaryStaticDisplay summary={summary} />);

      expect(screen.getByText('2000')).toBeInTheDocument();
      expect(screen.getByText('150g')).toBeInTheDocument();
      expect(screen.getByText('65g')).toBeInTheDocument();
      expect(screen.getByText('250g')).toBeInTheDocument();
    });

    it('should render correct labels', () => {
      const summary = createMockSummary();

      render(<DailySummaryStaticDisplay summary={summary} />);

      expect(screen.getByText('Total Kcal')).toBeInTheDocument();
      expect(screen.getByText('Proteins')).toBeInTheDocument();
      expect(screen.getByText('Fats')).toBeInTheDocument();
      expect(screen.getByText('Carbs')).toBeInTheDocument();
    });

    it('should render "Daily Summary" heading', () => {
      const summary = createMockSummary();

      render(<DailySummaryStaticDisplay summary={summary} />);

      const heading = screen.getByRole('heading', { level: 2, name: 'Daily Summary' });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('value formatting', () => {
    it('should display kcal without unit', () => {
      const summary = createMockSummary({ kcal: 2000 });

      render(<DailySummaryStaticDisplay summary={summary} />);

      expect(screen.getByText('2000')).toBeInTheDocument();
      // Should not have "g" suffix for kcal
      expect(screen.queryByText('2000g')).not.toBeInTheDocument();
    });

    it('should display proteins with "g" unit', () => {
      const summary = createMockSummary({ proteins: 150 });

      render(<DailySummaryStaticDisplay summary={summary} />);

      expect(screen.getByText('150g')).toBeInTheDocument();
    });

    it('should display fats with "g" unit', () => {
      const summary = createMockSummary({ fats: 65 });

      render(<DailySummaryStaticDisplay summary={summary} />);

      expect(screen.getByText('65g')).toBeInTheDocument();
    });

    it('should display carbs with "g" unit', () => {
      const summary = createMockSummary({ carbs: 250 });

      render(<DailySummaryStaticDisplay summary={summary} />);

      expect(screen.getByText('250g')).toBeInTheDocument();
    });
  });

  describe('zero values', () => {
    it('should display zero values correctly', () => {
      const summary = createMockSummary({
        kcal: 0,
        proteins: 0,
        fats: 0,
        carbs: 0,
      });

      render(<DailySummaryStaticDisplay summary={summary} />);

      expect(screen.getByText('0')).toBeInTheDocument();
      // Should appear 3 times (proteins, fats, carbs)
      const zeroGValues = screen.getAllByText('0g');
      expect(zeroGValues).toHaveLength(3);
    });

    it('should handle mixed zero and non-zero values', () => {
      const summary = createMockSummary({
        kcal: 2000,
        proteins: 0,
        fats: 65,
        carbs: 0,
      });

      render(<DailySummaryStaticDisplay summary={summary} />);

      expect(screen.getByText('2000')).toBeInTheDocument();
      expect(screen.getByText('65g')).toBeInTheDocument();
      const zeroGValues = screen.getAllByText('0g');
      expect(zeroGValues).toHaveLength(2); // proteins and carbs
    });
  });

  describe('large numbers', () => {
    it('should display large calorie values', () => {
      const summary = createMockSummary({ kcal: 5000 });

      render(<DailySummaryStaticDisplay summary={summary} />);

      expect(screen.getByText('5000')).toBeInTheDocument();
    });

    it('should display large macro values', () => {
      const summary = createMockSummary({
        proteins: 300,
        fats: 150,
        carbs: 500,
      });

      render(<DailySummaryStaticDisplay summary={summary} />);

      expect(screen.getByText('300g')).toBeInTheDocument();
      expect(screen.getByText('150g')).toBeInTheDocument();
      expect(screen.getByText('500g')).toBeInTheDocument();
    });
  });

  describe('decimal values', () => {
    it('should display decimal values as-is (formatting handled by number rendering)', () => {
      const summary = createMockSummary({
        kcal: 1999.5,
        proteins: 149.8,
        fats: 64.9,
        carbs: 249.3,
      });

      render(<DailySummaryStaticDisplay summary={summary} />);

      // React will render numbers directly, so decimals may appear
      // Exact rendering depends on React's number formatting
      expect(screen.getByText('1999.5')).toBeInTheDocument();
      expect(screen.getByText('149.8g')).toBeInTheDocument();
      expect(screen.getByText('64.9g')).toBeInTheDocument();
      expect(screen.getByText('249.3g')).toBeInTheDocument();
    });
  });

  describe('component structure', () => {
    it('should have proper container structure', () => {
      const summary = createMockSummary();

      const { container } = render(<DailySummaryStaticDisplay summary={summary} />);

      // Check for main container with border and padding classes
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toBeInTheDocument();
      expect(mainDiv.tagName).toBe('DIV');
    });

    it('should have responsive grid layout', () => {
      const summary = createMockSummary();

      const { container } = render(<DailySummaryStaticDisplay summary={summary} />);

      // Check for grid structure (implementation detail, but useful for regression)
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const summary = createMockSummary();

      render(<DailySummaryStaticDisplay summary={summary} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Daily Summary');
    });

    it('should have semantic structure for screen readers', () => {
      const summary = createMockSummary();

      const { container } = render(<DailySummaryStaticDisplay summary={summary} />);

      // Should have descriptive text for each value
      expect(screen.getByText('Total Kcal')).toBeInTheDocument();
      expect(screen.getByText('Proteins')).toBeInTheDocument();
      expect(screen.getByText('Fats')).toBeInTheDocument();
      expect(screen.getByText('Carbs')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle very small values', () => {
      const summary = createMockSummary({
        kcal: 1,
        proteins: 1,
        fats: 1,
        carbs: 1,
      });

      render(<DailySummaryStaticDisplay summary={summary} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getAllByText('1g')).toHaveLength(3);
    });

    it('should handle negative values (edge case - should not happen in practice)', () => {
      const summary = createMockSummary({
        kcal: -100,
        proteins: -50,
        fats: -25,
        carbs: -75,
      });

      render(<DailySummaryStaticDisplay summary={summary} />);

      expect(screen.getByText('-100')).toBeInTheDocument();
      expect(screen.getByText('-50g')).toBeInTheDocument();
      expect(screen.getByText('-25g')).toBeInTheDocument();
      expect(screen.getByText('-75g')).toBeInTheDocument();
    });
  });
});

