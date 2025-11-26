import { describe, it, expect } from "vitest";
import {
  multiDayStartupFormDataSchema,
  createMultiDayPlanSchema,
  updateMultiDayPlanSchema,
  listMultiDayPlansQuerySchema,
  exportMultiDayPlanQuerySchema,
} from "@/lib/validation/meal-plans.schemas";

describe("multi-day-plans schemas", () => {
  describe("multiDayStartupFormDataSchema", () => {
    it("should validate number_of_days (1-7, integer)", () => {
      const valid = { number_of_days: 1 };
      expect(() => multiDayStartupFormDataSchema.parse(valid)).not.toThrow();

      const valid7 = { number_of_days: 7 };
      expect(() => multiDayStartupFormDataSchema.parse(valid7)).not.toThrow();

      const invalid0 = { number_of_days: 0 };
      expect(() => multiDayStartupFormDataSchema.parse(invalid0)).toThrow();

      const invalid8 = { number_of_days: 8 };
      expect(() => multiDayStartupFormDataSchema.parse(invalid8)).toThrow();

      const invalidFloat = { number_of_days: 3.5 };
      expect(() => multiDayStartupFormDataSchema.parse(invalidFloat)).toThrow();
    });

    it("should validate ensure_meal_variety (boolean, default true)", () => {
      const withTrue = { number_of_days: 1, ensure_meal_variety: true };
      expect(multiDayStartupFormDataSchema.parse(withTrue).ensure_meal_variety).toBe(true);

      const withFalse = { number_of_days: 1, ensure_meal_variety: false };
      expect(multiDayStartupFormDataSchema.parse(withFalse).ensure_meal_variety).toBe(false);

      const withoutField = { number_of_days: 1 };
      expect(multiDayStartupFormDataSchema.parse(withoutField).ensure_meal_variety).toBe(true);
    });

    it("should validate different_guidelines_per_day (boolean, default false)", () => {
      const withTrue = { number_of_days: 1, different_guidelines_per_day: true, per_day_guidelines: "Some guidelines" };
      expect(multiDayStartupFormDataSchema.parse(withTrue).different_guidelines_per_day).toBe(true);

      const withFalse = { number_of_days: 1, different_guidelines_per_day: false };
      expect(multiDayStartupFormDataSchema.parse(withFalse).different_guidelines_per_day).toBe(false);

      const withoutField = { number_of_days: 1 };
      expect(multiDayStartupFormDataSchema.parse(withoutField).different_guidelines_per_day).toBe(false);
    });

    it("should require per_day_guidelines when different_guidelines_per_day is true", () => {
      const valid = {
        number_of_days: 1,
        different_guidelines_per_day: true,
        per_day_guidelines: "Some guidelines",
      };
      expect(() => multiDayStartupFormDataSchema.parse(valid)).not.toThrow();

      const invalid = {
        number_of_days: 1,
        different_guidelines_per_day: true,
        per_day_guidelines: null,
      };
      expect(() => multiDayStartupFormDataSchema.parse(invalid)).toThrow();

      const invalidEmpty = {
        number_of_days: 1,
        different_guidelines_per_day: true,
        per_day_guidelines: "",
      };
      expect(() => multiDayStartupFormDataSchema.parse(invalidEmpty)).toThrow();
    });

    it("should validate per_day_guidelines max length (2000)", () => {
      const valid = {
        number_of_days: 1,
        different_guidelines_per_day: true,
        per_day_guidelines: "a".repeat(2000),
      };
      expect(() => multiDayStartupFormDataSchema.parse(valid)).not.toThrow();

      const invalid = {
        number_of_days: 1,
        different_guidelines_per_day: true,
        per_day_guidelines: "a".repeat(2001),
      };
      expect(() => multiDayStartupFormDataSchema.parse(invalid)).toThrow();
    });

    it("should inherit mealPlanStartupDataSchema validations", () => {
      const valid = {
        number_of_days: 1,
        patient_age: 30,
        patient_weight: 70,
        patient_height: 175,
        activity_level: "moderate",
        target_kcal: 2000,
      };
      expect(() => multiDayStartupFormDataSchema.parse(valid)).not.toThrow();

      const invalidAge = {
        number_of_days: 1,
        patient_age: 200, // exceeds max
      };
      expect(() => multiDayStartupFormDataSchema.parse(invalidAge)).toThrow();

      const invalidActivity = {
        number_of_days: 1,
        activity_level: "invalid",
      };
      expect(() => multiDayStartupFormDataSchema.parse(invalidActivity)).toThrow();
    });
  });

  describe("createMultiDayPlanSchema", () => {
    const validDayPlan = {
      day_number: 1,
      plan_content: {
        daily_summary: {
          kcal: 2000,
          proteins: 150,
          fats: 65,
          carbs: 250,
        },
        meals: [
          {
            name: "Breakfast",
            ingredients: "Eggs",
            preparation: "Cook",
            summary: {
              kcal: 500,
              p: 30,
              f: 20,
              c: 50,
            },
          },
        ],
      },
      startup_data: {},
    };

    it("should validate name (min 1, max 255, required)", () => {
      const valid = {
        name: "Test Plan",
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 1,
        day_plans: [validDayPlan],
      };
      expect(() => createMultiDayPlanSchema.parse(valid)).not.toThrow();

      const invalidEmpty = {
        name: "",
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 1,
        day_plans: [validDayPlan],
      };
      expect(() => createMultiDayPlanSchema.parse(invalidEmpty)).toThrow();

      const invalidLong = {
        name: "a".repeat(256),
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 1,
        day_plans: [validDayPlan],
      };
      expect(() => createMultiDayPlanSchema.parse(invalidLong)).toThrow();

      const missing = {
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 1,
        day_plans: [validDayPlan],
      };
      expect(() => createMultiDayPlanSchema.parse(missing)).toThrow();
    });

    it("should validate source_chat_session_id (UUID, required)", () => {
      const valid = {
        name: "Test Plan",
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 1,
        day_plans: [validDayPlan],
      };
      expect(() => createMultiDayPlanSchema.parse(valid)).not.toThrow();

      const invalid = {
        name: "Test Plan",
        source_chat_session_id: "not-a-uuid",
        number_of_days: 1,
        day_plans: [validDayPlan],
      };
      expect(() => createMultiDayPlanSchema.parse(invalid)).toThrow();

      const missing = {
        name: "Test Plan",
        number_of_days: 1,
        day_plans: [validDayPlan],
      };
      expect(() => createMultiDayPlanSchema.parse(missing)).toThrow();
    });

    it("should validate number_of_days (1-7, required)", () => {
      const valid = {
        name: "Test Plan",
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 1,
        day_plans: [validDayPlan],
      };
      expect(() => createMultiDayPlanSchema.parse(valid)).not.toThrow();

      const invalid0 = {
        name: "Test Plan",
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 0,
        day_plans: [validDayPlan],
      };
      expect(() => createMultiDayPlanSchema.parse(invalid0)).toThrow();

      const invalid8 = {
        name: "Test Plan",
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 8,
        day_plans: [validDayPlan],
      };
      expect(() => createMultiDayPlanSchema.parse(invalid8)).toThrow();
    });

    it("should validate common_exclusions_guidelines (max 2000, nullable)", () => {
      const valid = {
        name: "Test Plan",
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 1,
        common_exclusions_guidelines: "a".repeat(2000),
        day_plans: [validDayPlan],
      };
      expect(() => createMultiDayPlanSchema.parse(valid)).not.toThrow();

      const validNull = {
        name: "Test Plan",
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 1,
        common_exclusions_guidelines: null,
        day_plans: [validDayPlan],
      };
      expect(() => createMultiDayPlanSchema.parse(validNull)).not.toThrow();

      const invalid = {
        name: "Test Plan",
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 1,
        common_exclusions_guidelines: "a".repeat(2001),
        day_plans: [validDayPlan],
      };
      expect(() => createMultiDayPlanSchema.parse(invalid)).toThrow();
    });

    it("should validate common_allergens (array of strings, nullable)", () => {
      const valid = {
        name: "Test Plan",
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 1,
        common_allergens: ["peanuts", "dairy"],
        day_plans: [validDayPlan],
      };
      expect(() => createMultiDayPlanSchema.parse(valid)).not.toThrow();

      const validNull = {
        name: "Test Plan",
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 1,
        common_allergens: null,
        day_plans: [validDayPlan],
      };
      expect(() => createMultiDayPlanSchema.parse(validNull)).not.toThrow();

      const invalid = {
        name: "Test Plan",
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 1,
        common_allergens: [123], // not strings
        day_plans: [validDayPlan],
      };
      expect(() => createMultiDayPlanSchema.parse(invalid)).toThrow();
    });

    it("should validate day_plans array (min 1, required)", () => {
      const valid = {
        name: "Test Plan",
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 1,
        day_plans: [validDayPlan],
      };
      expect(() => createMultiDayPlanSchema.parse(valid)).not.toThrow();

      const invalidEmpty = {
        name: "Test Plan",
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 1,
        day_plans: [],
      };
      expect(() => createMultiDayPlanSchema.parse(invalidEmpty)).toThrow();

      const missing = {
        name: "Test Plan",
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 1,
      };
      expect(() => createMultiDayPlanSchema.parse(missing)).toThrow();
    });

    it("should validate each day_plan.day_number (1-7)", () => {
      const valid = {
        name: "Test Plan",
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 1,
        day_plans: [{ ...validDayPlan, day_number: 1 }],
      };
      expect(() => createMultiDayPlanSchema.parse(valid)).not.toThrow();

      const invalid = {
        name: "Test Plan",
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 1,
        day_plans: [{ ...validDayPlan, day_number: 0 }],
      };
      expect(() => createMultiDayPlanSchema.parse(invalid)).toThrow();
    });

    it("should validate each day_plan.plan_content structure", () => {
      const valid = {
        name: "Test Plan",
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 1,
        day_plans: [validDayPlan],
      };
      expect(() => createMultiDayPlanSchema.parse(valid)).not.toThrow();

      const invalid = {
        name: "Test Plan",
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 1,
        day_plans: [
          {
            ...validDayPlan,
            plan_content: {
              daily_summary: { kcal: 0 }, // invalid
            },
          },
        ],
      };
      expect(() => createMultiDayPlanSchema.parse(invalid)).toThrow();
    });

    it("should validate each day_plan.startup_data structure", () => {
      const valid = {
        name: "Test Plan",
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 1,
        day_plans: [validDayPlan],
      };
      expect(() => createMultiDayPlanSchema.parse(valid)).not.toThrow();

      const invalid = {
        name: "Test Plan",
        source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
        number_of_days: 1,
        day_plans: [
          {
            ...validDayPlan,
            startup_data: {
              patient_age: 200, // exceeds max
            },
          },
        ],
      };
      expect(() => createMultiDayPlanSchema.parse(invalid)).toThrow();
    });
  });

  describe("updateMultiDayPlanSchema", () => {
    const validDayPlan = {
      day_number: 1,
      plan_content: {
        daily_summary: {
          kcal: 2000,
          proteins: 150,
          fats: 65,
          carbs: 250,
        },
        meals: [
          {
            name: "Breakfast",
            ingredients: "Eggs",
            preparation: "Cook",
            summary: {
              kcal: 500,
              p: 30,
              f: 20,
              c: 50,
            },
          },
        ],
      },
      startup_data: {},
    };

    it("should allow all fields optional", () => {
      const empty = {};
      expect(() => updateMultiDayPlanSchema.parse(empty)).not.toThrow();
    });

    it("should validate name when provided", () => {
      const valid = { name: "Updated Plan" };
      expect(() => updateMultiDayPlanSchema.parse(valid)).not.toThrow();

      const invalid = { name: "" };
      expect(() => updateMultiDayPlanSchema.parse(invalid)).toThrow();
    });

    it("should validate day_plans when provided", () => {
      const valid = {
        day_plans: [validDayPlan],
      };
      expect(() => updateMultiDayPlanSchema.parse(valid)).not.toThrow();

      const invalid = {
        day_plans: [{ ...validDayPlan, day_number: 0 }],
      };
      expect(() => updateMultiDayPlanSchema.parse(invalid)).toThrow();
    });

    it("should validate common_exclusions_guidelines when provided", () => {
      const valid = {
        common_exclusions_guidelines: "No dairy",
      };
      expect(() => updateMultiDayPlanSchema.parse(valid)).not.toThrow();

      const validNull = {
        common_exclusions_guidelines: null,
      };
      expect(() => updateMultiDayPlanSchema.parse(validNull)).not.toThrow();

      const invalid = {
        common_exclusions_guidelines: "a".repeat(2001),
      };
      expect(() => updateMultiDayPlanSchema.parse(invalid)).toThrow();
    });

    it("should validate common_allergens when provided", () => {
      const valid = {
        common_allergens: ["peanuts"],
      };
      expect(() => updateMultiDayPlanSchema.parse(valid)).not.toThrow();

      const validNull = {
        common_allergens: null,
      };
      expect(() => updateMultiDayPlanSchema.parse(validNull)).not.toThrow();

      const invalid = {
        common_allergens: [123],
      };
      expect(() => updateMultiDayPlanSchema.parse(invalid)).toThrow();
    });
  });

  describe("listMultiDayPlansQuerySchema", () => {
    it("should validate search (max 100, optional)", () => {
      const valid = { search: "test" };
      expect(() => listMultiDayPlansQuerySchema.parse(valid)).not.toThrow();

      const validLong = { search: "a".repeat(100) };
      expect(() => listMultiDayPlansQuerySchema.parse(validLong)).not.toThrow();

      const invalid = { search: "a".repeat(101) };
      expect(() => listMultiDayPlansQuerySchema.parse(invalid)).toThrow();

      const empty = {};
      expect(() => listMultiDayPlansQuerySchema.parse(empty)).not.toThrow();
    });

    it("should validate sort (enum, default: updated_at)", () => {
      const validCreated = { sort: "created_at" };
      expect(listMultiDayPlansQuerySchema.parse(validCreated).sort).toBe("created_at");

      const validUpdated = { sort: "updated_at" };
      expect(listMultiDayPlansQuerySchema.parse(validUpdated).sort).toBe("updated_at");

      const validName = { sort: "name" };
      expect(listMultiDayPlansQuerySchema.parse(validName).sort).toBe("name");

      const empty = {};
      expect(listMultiDayPlansQuerySchema.parse(empty).sort).toBe("updated_at");

      const invalid = { sort: "invalid" };
      expect(() => listMultiDayPlansQuerySchema.parse(invalid)).toThrow();
    });

    it("should validate order (enum, default: desc)", () => {
      const validAsc = { order: "asc" };
      expect(listMultiDayPlansQuerySchema.parse(validAsc).order).toBe("asc");

      const validDesc = { order: "desc" };
      expect(listMultiDayPlansQuerySchema.parse(validDesc).order).toBe("desc");

      const empty = {};
      expect(listMultiDayPlansQuerySchema.parse(empty).order).toBe("desc");

      const invalid = { order: "invalid" };
      expect(() => listMultiDayPlansQuerySchema.parse(invalid)).toThrow();
    });
  });

  describe("exportMultiDayPlanQuerySchema", () => {
    it("should validate format (enum: doc/html, required)", () => {
      const validDoc = { format: "doc" };
      expect(() => exportMultiDayPlanQuerySchema.parse(validDoc)).not.toThrow();

      const validHtml = { format: "html" };
      expect(() => exportMultiDayPlanQuerySchema.parse(validHtml)).not.toThrow();

      const missing = {};
      expect(() => exportMultiDayPlanQuerySchema.parse(missing)).toThrow();

      const invalid = { format: "pdf" };
      expect(() => exportMultiDayPlanQuerySchema.parse(invalid)).toThrow();
    });

    it("should validate boolean flags (default: true)", () => {
      const withTrue = {
        format: "doc",
        dailySummary: "true",
        mealsSummary: "true",
        ingredients: "true",
        preparation: "true",
      };
      const parsed = exportMultiDayPlanQuerySchema.parse(withTrue);
      expect(parsed.dailySummary).toBe("true");
      expect(parsed.mealsSummary).toBe("true");
      expect(parsed.ingredients).toBe("true");
      expect(parsed.preparation).toBe("true");

      const withDefaults = { format: "doc" };
      const parsedDefaults = exportMultiDayPlanQuerySchema.parse(withDefaults);
      expect(parsedDefaults.dailySummary).toBe("true");
      expect(parsedDefaults.mealsSummary).toBe("true");
      expect(parsedDefaults.ingredients).toBe("true");
      expect(parsedDefaults.preparation).toBe("true");
    });
  });
});
