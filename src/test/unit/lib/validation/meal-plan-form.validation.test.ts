import { describe, it, expect } from "vitest";
import { validateMealPlanForm, isMealPlanFormReady } from "@/lib/validation/meal-plan-form.validation";
import type { MealPlanMeal } from "@/types";

describe("validateMealPlanForm", () => {
  const createMockMeal = (overrides?: Partial<MealPlanMeal>): MealPlanMeal => ({
    name: "Breakfast",
    ingredients: "Eggs, toast",
    preparation: "Cook eggs",
    summary: {
      kcal: 500,
      p: 30,
      f: 20,
      c: 50,
    },
    ...overrides,
  });

  describe("valid form state", () => {
    it("should return null for valid form with single meal", () => {
      const state = {
        planName: "My Meal Plan",
        meals: [createMockMeal()],
      };

      const result = validateMealPlanForm(state);

      expect(result).toBeNull();
    });

    it("should return null for valid form with multiple meals", () => {
      const state = {
        planName: "Weekly Meal Plan",
        meals: [
          createMockMeal({ name: "Breakfast" }),
          createMockMeal({ name: "Lunch" }),
          createMockMeal({ name: "Dinner" }),
        ],
      };

      const result = validateMealPlanForm(state);

      expect(result).toBeNull();
    });

    it("should return null for plan name with leading/trailing whitespace", () => {
      const state = {
        planName: "  My Meal Plan  ",
        meals: [createMockMeal()],
      };

      const result = validateMealPlanForm(state);

      expect(result).toBeNull();
    });
  });

  describe("invalid plan name", () => {
    it("should return error for empty plan name", () => {
      const state = {
        planName: "",
        meals: [createMockMeal()],
      };

      const result = validateMealPlanForm(state);

      expect(result).toBe("Plan name is required");
    });

    it("should return error for whitespace-only plan name", () => {
      const state = {
        planName: "   ",
        meals: [createMockMeal()],
      };

      const result = validateMealPlanForm(state);

      expect(result).toBe("Plan name is required");
    });

    it("should return error for plan name with only newlines", () => {
      const state = {
        planName: "\n\n\n",
        meals: [createMockMeal()],
      };

      const result = validateMealPlanForm(state);

      expect(result).toBe("Plan name is required");
    });
  });

  describe("invalid meals array", () => {
    it("should return error for empty meals array", () => {
      const state = {
        planName: "My Meal Plan",
        meals: [],
      };

      const result = validateMealPlanForm(state);

      expect(result).toBe("At least one meal is required");
    });
  });

  describe("invalid meal names", () => {
    it("should return error for meal with empty name", () => {
      const state = {
        planName: "My Meal Plan",
        meals: [createMockMeal({ name: "" })],
      };

      const result = validateMealPlanForm(state);

      expect(result).toBe("Meal 1 name is required");
    });

    it("should return error for meal with whitespace-only name", () => {
      const state = {
        planName: "My Meal Plan",
        meals: [createMockMeal({ name: "   " })],
      };

      const result = validateMealPlanForm(state);

      expect(result).toBe("Meal 1 name is required");
    });

    it("should return error for first meal with empty name when multiple meals exist", () => {
      const state = {
        planName: "My Meal Plan",
        meals: [createMockMeal({ name: "" }), createMockMeal({ name: "Lunch" })],
      };

      const result = validateMealPlanForm(state);

      expect(result).toBe("Meal 1 name is required");
    });

    it("should return error for second meal with empty name", () => {
      const state = {
        planName: "My Meal Plan",
        meals: [createMockMeal({ name: "Breakfast" }), createMockMeal({ name: "" })],
      };

      const result = validateMealPlanForm(state);

      expect(result).toBe("Meal 2 name is required");
    });

    it("should return error for third meal with empty name", () => {
      const state = {
        planName: "My Meal Plan",
        meals: [
          createMockMeal({ name: "Breakfast" }),
          createMockMeal({ name: "Lunch" }),
          createMockMeal({ name: "   " }),
        ],
      };

      const result = validateMealPlanForm(state);

      expect(result).toBe("Meal 3 name is required");
    });
  });

  describe("edge cases", () => {
    it("should handle meal with empty ingredients and preparation", () => {
      const state = {
        planName: "My Meal Plan",
        meals: [
          createMockMeal({
            name: "Breakfast",
            ingredients: "",
            preparation: "",
          }),
        ],
      };

      const result = validateMealPlanForm(state);

      expect(result).toBeNull();
    });

    it("should handle meal with zero summary values", () => {
      const state = {
        planName: "My Meal Plan",
        meals: [
          createMockMeal({
            name: "Breakfast",
            summary: {
              kcal: 0,
              p: 0,
              f: 0,
              c: 0,
            },
          }),
        ],
      };

      const result = validateMealPlanForm(state);

      expect(result).toBeNull();
    });
  });
});

describe("isMealPlanFormReady", () => {
  const createMockMeal = (overrides?: Partial<MealPlanMeal>): MealPlanMeal => ({
    name: "Breakfast",
    ingredients: "Eggs",
    preparation: "Cook",
    summary: { kcal: 500, p: 30, f: 20, c: 50 },
    ...overrides,
  });

  describe("form ready state", () => {
    it("should return true for valid form when not loading", () => {
      const state = {
        planName: "My Meal Plan",
        meals: [createMockMeal()],
      };

      const result = isMealPlanFormReady(state, false);

      expect(result).toBe(true);
    });

    it("should return true for form with multiple valid meals", () => {
      const state = {
        planName: "Weekly Plan",
        meals: [createMockMeal({ name: "Breakfast" }), createMockMeal({ name: "Lunch" })],
      };

      const result = isMealPlanFormReady(state, false);

      expect(result).toBe(true);
    });

    it("should handle plan name with whitespace", () => {
      const state = {
        planName: "  My Meal Plan  ",
        meals: [createMockMeal()],
      };

      const result = isMealPlanFormReady(state, false);

      expect(result).toBe(true);
    });
  });

  describe("form not ready state", () => {
    it("should return false when loading", () => {
      const state = {
        planName: "My Meal Plan",
        meals: [createMockMeal()],
      };

      const result = isMealPlanFormReady(state, true);

      expect(result).toBe(false);
    });

    it("should return false for empty plan name", () => {
      const state = {
        planName: "",
        meals: [createMockMeal()],
      };

      const result = isMealPlanFormReady(state, false);

      expect(result).toBe(false);
    });

    it("should return false for whitespace-only plan name", () => {
      const state = {
        planName: "   ",
        meals: [createMockMeal()],
      };

      const result = isMealPlanFormReady(state, false);

      expect(result).toBe(false);
    });

    it("should return false for empty meals array", () => {
      const state = {
        planName: "My Meal Plan",
        meals: [],
      };

      const result = isMealPlanFormReady(state, false);

      expect(result).toBe(false);
    });

    it("should return false when any meal has empty name", () => {
      const state = {
        planName: "My Meal Plan",
        meals: [createMockMeal({ name: "Breakfast" }), createMockMeal({ name: "" })],
      };

      const result = isMealPlanFormReady(state, false);

      expect(result).toBe(false);
    });

    it("should return false when any meal has whitespace-only name", () => {
      const state = {
        planName: "My Meal Plan",
        meals: [createMockMeal({ name: "Breakfast" }), createMockMeal({ name: "   " })],
      };

      const result = isMealPlanFormReady(state, false);

      expect(result).toBe(false);
    });

    it("should return false when loading even with valid form", () => {
      const state = {
        planName: "My Meal Plan",
        meals: [createMockMeal()],
      };

      const result = isMealPlanFormReady(state, true);

      expect(result).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should return false for multiple conditions (loading + empty name)", () => {
      const state = {
        planName: "",
        meals: [],
      };

      const result = isMealPlanFormReady(state, true);

      expect(result).toBe(false);
    });

    it("should handle form with valid name but empty meals", () => {
      const state = {
        planName: "Valid Name",
        meals: [],
      };

      const result = isMealPlanFormReady(state, false);

      expect(result).toBe(false);
    });
  });
});
