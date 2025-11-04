import { describe, it, expect } from "vitest";
import { calculateDailySummaryFromTargets, resolveDailySummary } from "@/lib/utils/meal-plan-calculations";
import type { MealPlanContentDailySummary, MealPlanStartupData } from "@/types";

describe("calculateDailySummaryFromTargets", () => {
  describe("valid calculations", () => {
    it("should calculate correctly from target kcal and macro distribution", () => {
      const targetKcal = 2000;
      const macroDistribution = {
        p_perc: 30, // 30% protein
        f_perc: 25, // 25% fat
        c_perc: 45, // 45% carbs
      };

      const result = calculateDailySummaryFromTargets(targetKcal, macroDistribution);

      // Proteins: (2000 * 30) / 100 / 4 = 150g
      // Fats: (2000 * 25) / 100 / 9 = 55.55... ≈ 56g
      // Carbs: (2000 * 45) / 100 / 4 = 225g
      expect(result.kcal).toBe(2000);
      expect(result.proteins).toBe(150);
      expect(result.fats).toBe(56);
      expect(result.carbs).toBe(225);
    });

    it("should round values correctly", () => {
      const targetKcal = 1800;
      const macroDistribution = {
        p_perc: 33.33,
        f_perc: 27.77,
        c_perc: 38.9,
      };

      const result = calculateDailySummaryFromTargets(targetKcal, macroDistribution);

      // Proteins: (1800 * 33.33) / 100 / 4 = 149.985 ≈ 150g
      // Fats: (1800 * 27.77) / 100 / 9 = 55.54 ≈ 56g
      // Carbs: (1800 * 38.9) / 100 / 4 = 175.05 ≈ 175g
      expect(result.kcal).toBe(1800);
      expect(result.proteins).toBe(150);
      expect(result.fats).toBe(56);
      expect(result.carbs).toBe(175);
    });

    it("should handle high protein diet", () => {
      const targetKcal = 2500;
      const macroDistribution = {
        p_perc: 40, // 40% protein
        f_perc: 30, // 30% fat
        c_perc: 30, // 30% carbs
      };

      const result = calculateDailySummaryFromTargets(targetKcal, macroDistribution);

      // Proteins: (2500 * 40) / 100 / 4 = 250g
      // Fats: (2500 * 30) / 100 / 9 = 83.33... ≈ 83g
      // Carbs: (2500 * 30) / 100 / 4 = 187.5 ≈ 188g
      expect(result.kcal).toBe(2500);
      expect(result.proteins).toBe(250);
      expect(result.fats).toBe(83);
      expect(result.carbs).toBe(188);
    });

    it("should handle low carb diet", () => {
      const targetKcal = 1500;
      const macroDistribution = {
        p_perc: 35, // 35% protein
        f_perc: 45, // 45% fat
        c_perc: 20, // 20% carbs
      };

      const result = calculateDailySummaryFromTargets(targetKcal, macroDistribution);

      // Proteins: (1500 * 35) / 100 / 4 = 131.25 ≈ 131g
      // Fats: (1500 * 45) / 100 / 9 = 75g
      // Carbs: (1500 * 20) / 100 / 4 = 75g
      expect(result.kcal).toBe(1500);
      expect(result.proteins).toBe(131);
      expect(result.fats).toBe(75);
      expect(result.carbs).toBe(75);
    });

    it("should handle very high calorie target", () => {
      const targetKcal = 4000;
      const macroDistribution = {
        p_perc: 25,
        f_perc: 25,
        c_perc: 50,
      };

      const result = calculateDailySummaryFromTargets(targetKcal, macroDistribution);

      expect(result.kcal).toBe(4000);
      expect(result.proteins).toBe(250); // (4000 * 25) / 100 / 4
      expect(result.fats).toBe(111); // (4000 * 25) / 100 / 9 = 111.11...
      expect(result.carbs).toBe(500); // (4000 * 50) / 100 / 4
    });

    it("should handle low calorie target", () => {
      const targetKcal = 1200;
      const macroDistribution = {
        p_perc: 30,
        f_perc: 30,
        c_perc: 40,
      };

      const result = calculateDailySummaryFromTargets(targetKcal, macroDistribution);

      expect(result.kcal).toBe(1200);
      expect(result.proteins).toBe(90); // (1200 * 30) / 100 / 4
      expect(result.fats).toBe(40); // (1200 * 30) / 100 / 9 = 40
      expect(result.carbs).toBe(120); // (1200 * 40) / 100 / 4
    });
  });

  describe("missing data handling", () => {
    it("should return zeros when targetKcal is null, undefined, or zero", () => {
      const macroDistribution = { p_perc: 30, f_perc: 25, c_perc: 45 };
      const zeroResult = { kcal: 0, proteins: 0, fats: 0, carbs: 0 };

      expect(calculateDailySummaryFromTargets(null, macroDistribution)).toEqual(zeroResult);
      expect(calculateDailySummaryFromTargets(undefined, macroDistribution)).toEqual(zeroResult);
      expect(calculateDailySummaryFromTargets(0, macroDistribution)).toEqual(zeroResult);
    });

    it("should return zeros when macroDistribution is null or undefined", () => {
      const zeroResult = { kcal: 0, proteins: 0, fats: 0, carbs: 0 };

      expect(calculateDailySummaryFromTargets(2000, null)).toEqual(zeroResult);
      expect(calculateDailySummaryFromTargets(2000, undefined)).toEqual(zeroResult);
      expect(calculateDailySummaryFromTargets(null, null)).toEqual(zeroResult);
    });
  });

  describe("edge cases", () => {
    it("should handle 100% protein distribution (edge case)", () => {
      const targetKcal = 2000;
      const macroDistribution = {
        p_perc: 100,
        f_perc: 0,
        c_perc: 0,
      };

      const result = calculateDailySummaryFromTargets(targetKcal, macroDistribution);

      expect(result.kcal).toBe(2000);
      expect(result.proteins).toBe(500); // (2000 * 100) / 100 / 4
      expect(result.fats).toBe(0);
      expect(result.carbs).toBe(0);
    });

    it("should handle fractional percentages that sum to 100", () => {
      const targetKcal = 2000;
      const macroDistribution = {
        p_perc: 33.333,
        f_perc: 33.333,
        c_perc: 33.334,
      };

      const result = calculateDailySummaryFromTargets(targetKcal, macroDistribution);

      expect(result.kcal).toBe(2000);
      // All should round appropriately
      expect(result.proteins).toBeGreaterThan(0);
      expect(result.fats).toBeGreaterThan(0);
      expect(result.carbs).toBeGreaterThan(0);
    });
  });
});

describe("resolveDailySummary", () => {
  const mockStartupData: MealPlanStartupData = {
    patient_age: 30,
    patient_weight: 70,
    patient_height: 175,
    activity_level: "moderate",
    target_kcal: 2000,
    target_macro_distribution: {
      p_perc: 30,
      f_perc: 25,
      c_perc: 45,
    },
    meal_names: null,
    exclusions_guidelines: null,
  };

  describe("preferring parsed summary", () => {
    it("should use parsed summary when kcal > 0", () => {
      const parsedSummary: MealPlanContentDailySummary = {
        kcal: 2500,
        proteins: 180,
        fats: 75,
        carbs: 280,
      };

      const result = resolveDailySummary(parsedSummary, mockStartupData);

      expect(result).toEqual(parsedSummary);
    });

    it("should use parsed summary even if different from calculated", () => {
      const parsedSummary: MealPlanContentDailySummary = {
        kcal: 1800,
        proteins: 120,
        fats: 50,
        carbs: 200,
      };

      const result = resolveDailySummary(parsedSummary, mockStartupData);

      expect(result).toEqual(parsedSummary);
      // Should not use calculated values from startupData
      expect(result.kcal).not.toBe(mockStartupData.target_kcal);
    });

    it("should use parsed summary with zero macros if kcal > 0", () => {
      const parsedSummary: MealPlanContentDailySummary = {
        kcal: 2000,
        proteins: 0,
        fats: 0,
        carbs: 0,
      };

      const result = resolveDailySummary(parsedSummary, mockStartupData);

      expect(result).toEqual(parsedSummary);
    });
  });

  describe("falling back to calculated values", () => {
    it("should calculate from startup data when parsed kcal is 0", () => {
      const parsedSummary: MealPlanContentDailySummary = {
        kcal: 0,
        proteins: 0,
        fats: 0,
        carbs: 0,
      };

      const result = resolveDailySummary(parsedSummary, mockStartupData);

      expect(result.kcal).toBe(2000);
      expect(result.proteins).toBe(150); // (2000 * 30) / 100 / 4
      expect(result.fats).toBe(56); // (2000 * 25) / 100 / 9
      expect(result.carbs).toBe(225); // (2000 * 45) / 100 / 4
    });

    it("should return zeros when startup data is null, undefined, or missing required fields", () => {
      const parsedSummary: MealPlanContentDailySummary = {
        kcal: 0,
        proteins: 0,
        fats: 0,
        carbs: 0,
      };
      const zeroResult = { kcal: 0, proteins: 0, fats: 0, carbs: 0 };

      const startupDataWithoutMacros: MealPlanStartupData = {
        ...mockStartupData,
        target_macro_distribution: null,
      };

      const startupDataWithoutKcal: MealPlanStartupData = {
        ...mockStartupData,
        target_kcal: null,
      };

      expect(resolveDailySummary(parsedSummary, null)).toEqual(zeroResult);
      expect(resolveDailySummary(parsedSummary, undefined)).toEqual(zeroResult);
      expect(resolveDailySummary(parsedSummary, startupDataWithoutMacros)).toEqual(zeroResult);
      expect(resolveDailySummary(parsedSummary, startupDataWithoutKcal)).toEqual(zeroResult);
    });
  });

  describe("edge cases", () => {
    it("should handle parsed summary with kcal = 1 (borderline case)", () => {
      const parsedSummary: MealPlanContentDailySummary = {
        kcal: 1,
        proteins: 0,
        fats: 0,
        carbs: 0,
      };

      const result = resolveDailySummary(parsedSummary, mockStartupData);

      // Should use parsed summary since kcal > 0
      expect(result).toEqual(parsedSummary);
    });

    it("should handle negative kcal in parsed summary", () => {
      const parsedSummary: MealPlanContentDailySummary = {
        kcal: -100,
        proteins: 0,
        fats: 0,
        carbs: 0,
      };

      // Negative kcal is < 0, so should fall back to calculated
      const result = resolveDailySummary(parsedSummary, mockStartupData);

      expect(result.kcal).toBe(2000); // Uses calculated value
    });

    it("should handle very large parsed summary values", () => {
      const parsedSummary: MealPlanContentDailySummary = {
        kcal: 10000,
        proteins: 500,
        fats: 200,
        carbs: 1000,
      };

      const result = resolveDailySummary(parsedSummary, mockStartupData);

      expect(result).toEqual(parsedSummary);
    });
  });
});
