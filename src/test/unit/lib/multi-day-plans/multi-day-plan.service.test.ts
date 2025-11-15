import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  listMultiDayPlans,
  createMultiDayPlan,
  getMultiDayPlanById,
  updateMultiDayPlan,
  deleteMultiDayPlan,
} from "@/lib/multi-day-plans/multi-day-plan.service";
import { DatabaseError, NotFoundError } from "@/lib/errors";
import * as MealPlanService from "@/lib/meal-plans/meal-plan.service";

// Mock MealPlanService
vi.mock("@/lib/meal-plans/meal-plan.service", () => ({
  createMealPlan: vi.fn(),
  getMealPlanById: vi.fn(),
  deleteMealPlan: vi.fn(),
}));

describe("multi-day-plan.service", () => {
  const userId = "test-user-id";
  let mockSupabase: SupabaseClient;

  // Helper to create chainable query builder
  const createQueryBuilder = (data: unknown[] = [], error: unknown = null) => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data, error }),
      single: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
    };
    return builder;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn().mockReturnValue(createQueryBuilder()),
    } as unknown as SupabaseClient;
  });

  describe("listMultiDayPlans", () => {
    it("should return empty array when no plans exist", async () => {
      const queryBuilder = createQueryBuilder([]);
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(queryBuilder);

      const result = await listMultiDayPlans(userId, {}, mockSupabase);

      expect(result).toEqual([]);
      expect(mockSupabase.from).toHaveBeenCalledWith("multi_day_plans");
      expect(queryBuilder.select).toHaveBeenCalledWith("*");
      expect(queryBuilder.eq).toHaveBeenCalledWith("user_id", userId);
    });

    it("should return all plans for user", async () => {
      const mockPlans = [
        {
          id: "plan-1",
          name: "Plan 1",
          number_of_days: 3,
          average_kcal: 2000,
          average_proteins: 150,
          average_fats: 65,
          average_carbs: 250,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "plan-2",
          name: "Plan 2",
          number_of_days: 5,
          average_kcal: 1800,
          average_proteins: 140,
          average_fats: 60,
          average_carbs: 230,
          created_at: "2024-01-02T00:00:00Z",
          updated_at: "2024-01-02T00:00:00Z",
        },
      ];

      const queryBuilder = createQueryBuilder(mockPlans);
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(queryBuilder);

      const result = await listMultiDayPlans(userId, {}, mockSupabase);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("plan-1");
      expect(result[1].id).toBe("plan-2");
    });

    it("should filter by search term (case-insensitive)", async () => {
      const mockPlans = [
        {
          id: "plan-1",
          name: "Test Plan",
          number_of_days: 3,
          average_kcal: 2000,
          average_proteins: 150,
          average_fats: 65,
          average_carbs: 250,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      const queryBuilder = createQueryBuilder(mockPlans);
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(queryBuilder);

      await listMultiDayPlans(userId, { search: "test" }, mockSupabase);

      expect(queryBuilder.ilike).toHaveBeenCalledWith("name", "%test%");
    });

    it("should sort by created_at (asc/desc)", async () => {
      const queryBuilder = createQueryBuilder([]);
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(queryBuilder);

      await listMultiDayPlans(userId, { sort: "created_at", order: "asc" }, mockSupabase);
      expect(queryBuilder.order).toHaveBeenCalledWith("created_at", { ascending: true });

      await listMultiDayPlans(userId, { sort: "created_at", order: "desc" }, mockSupabase);
      expect(queryBuilder.order).toHaveBeenCalledWith("created_at", { ascending: false });
    });

    it("should sort by updated_at (asc/desc)", async () => {
      const queryBuilder = createQueryBuilder([]);
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(queryBuilder);

      await listMultiDayPlans(userId, { sort: "updated_at", order: "asc" }, mockSupabase);
      expect(queryBuilder.order).toHaveBeenCalledWith("updated_at", { ascending: true });
    });

    it("should sort by name (asc/desc)", async () => {
      const queryBuilder = createQueryBuilder([]);
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(queryBuilder);

      await listMultiDayPlans(userId, { sort: "name", order: "asc" }, mockSupabase);
      expect(queryBuilder.order).toHaveBeenCalledWith("name", { ascending: true });
    });

    it("should handle database errors", async () => {
      const dbError = { message: "Database error", code: "PGRST116" };
      const queryBuilder = createQueryBuilder([], dbError);
      queryBuilder.order = vi.fn().mockResolvedValue({ data: null, error: dbError });
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(queryBuilder);

      await expect(listMultiDayPlans(userId, {}, mockSupabase)).rejects.toThrow(DatabaseError);
      await expect(listMultiDayPlans(userId, {}, mockSupabase)).rejects.toThrow(
        "Failed to list multi-day plans"
      );
    });

  });

  describe("createMultiDayPlan", () => {
    const validCommand = {
      name: "Test Plan",
      source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
      number_of_days: 2,
      common_exclusions_guidelines: "No dairy",
      common_allergens: ["peanuts"],
      day_plans: [
        {
          day_number: 1,
          name: "Day 1",
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
        },
        {
          day_number: 2,
          name: "Day 2",
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
        },
      ],
    };

    const mockMultiDayPlan = {
      id: "multi-day-plan-id",
      name: "Test Plan",
      source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
      number_of_days: 2,
      common_exclusions_guidelines: "No dairy",
      common_allergens: ["peanuts"],
      user_id: userId,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    const mockDayPlan1 = {
      id: "day-plan-1",
      name: "Day 1",
      user_id: userId,
      plan_content: {
        daily_summary: { kcal: 2000, proteins: 150, fats: 65, carbs: 250 },
        meals: [],
      },
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    const mockDayPlan2 = {
      id: "day-plan-2",
      name: "Day 2",
      user_id: userId,
      plan_content: {
        daily_summary: { kcal: 2000, proteins: 150, fats: 65, carbs: 250 },
        meals: [],
      },
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    it("should create multi-day plan successfully", async () => {
      const insertBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMultiDayPlan, error: null }),
      };

      const updateBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      const linkBuilder = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "multi_day_plans") {
          return insertBuilder;
        }
        if (table === "meal_plans") {
          return updateBuilder;
        }
        if (table === "multi_day_plan_days") {
          return linkBuilder;
        }
        return createQueryBuilder();
      });

      vi.mocked(MealPlanService.createMealPlan)
        .mockResolvedValueOnce(mockDayPlan1 as any)
        .mockResolvedValueOnce(mockDayPlan2 as any);

      const result = await createMultiDayPlan(validCommand, userId, mockSupabase);

      expect(result.id).toBe("multi-day-plan-id");
      expect(result.days).toHaveLength(2);
      expect(result.days[0].day_number).toBe(1);
      expect(result.days[1].day_number).toBe(2);
    });

    it("should create all day plans", async () => {
      const insertBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMultiDayPlan, error: null }),
      };

      const updateBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      const linkBuilder = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "multi_day_plans") return insertBuilder;
        if (table === "meal_plans") return updateBuilder;
        if (table === "multi_day_plan_days") return linkBuilder;
        return createQueryBuilder();
      });

      vi.mocked(MealPlanService.createMealPlan)
        .mockResolvedValueOnce(mockDayPlan1 as any)
        .mockResolvedValueOnce(mockDayPlan2 as any);

      await createMultiDayPlan(validCommand, userId, mockSupabase);

      expect(MealPlanService.createMealPlan).toHaveBeenCalledTimes(2);
    });

    it("should mark day plans with is_day_plan = true", async () => {
      const insertBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMultiDayPlan, error: null }),
      };

      const updateBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      const linkBuilder = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "multi_day_plans") return insertBuilder;
        if (table === "meal_plans") return updateBuilder;
        if (table === "multi_day_plan_days") return linkBuilder;
        return createQueryBuilder();
      });

      vi.mocked(MealPlanService.createMealPlan)
        .mockResolvedValueOnce(mockDayPlan1 as any)
        .mockResolvedValueOnce(mockDayPlan2 as any);

      await createMultiDayPlan(validCommand, userId, mockSupabase);

      expect(updateBuilder.update).toHaveBeenCalledWith({ is_day_plan: true });
      expect(updateBuilder.eq).toHaveBeenCalledWith("id", "day-plan-1");
      expect(updateBuilder.eq).toHaveBeenCalledWith("id", "day-plan-2");
    });

    it("should link day plans via junction table", async () => {
      const insertBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMultiDayPlan, error: null }),
      };

      const updateBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      const linkBuilder = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "multi_day_plans") return insertBuilder;
        if (table === "meal_plans") return updateBuilder;
        if (table === "multi_day_plan_days") return linkBuilder;
        return createQueryBuilder();
      });

      vi.mocked(MealPlanService.createMealPlan)
        .mockResolvedValueOnce(mockDayPlan1 as any)
        .mockResolvedValueOnce(mockDayPlan2 as any);

      await createMultiDayPlan(validCommand, userId, mockSupabase);

      expect(linkBuilder.insert).toHaveBeenCalledTimes(2);
      expect(linkBuilder.insert).toHaveBeenCalledWith({
        multi_day_plan_id: "multi-day-plan-id",
        day_plan_id: "day-plan-1",
        day_number: 1,
      });
    });

    it("should sort days by day_number in response", async () => {
      const insertBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMultiDayPlan, error: null }),
      };

      const updateBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      const linkBuilder = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "multi_day_plans") return insertBuilder;
        if (table === "meal_plans") return updateBuilder;
        if (table === "multi_day_plan_days") return linkBuilder;
        return createQueryBuilder();
      });

      // Create days out of order
      const commandWithUnsortedDays = {
        ...validCommand,
        day_plans: [validCommand.day_plans[1], validCommand.day_plans[0]],
      };

      vi.mocked(MealPlanService.createMealPlan)
        .mockResolvedValueOnce(mockDayPlan2 as any)
        .mockResolvedValueOnce(mockDayPlan1 as any);

      const result = await createMultiDayPlan(commandWithUnsortedDays, userId, mockSupabase);

      expect(result.days[0].day_number).toBe(1);
      expect(result.days[1].day_number).toBe(2);
    });

    it("should generate default day names when missing", async () => {
      const commandWithoutNames = {
        ...validCommand,
        day_plans: [
          {
            ...validCommand.day_plans[0],
            name: undefined,
          },
        ],
      };

      const insertBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMultiDayPlan, error: null }),
      };

      const updateBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      const linkBuilder = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "multi_day_plans") return insertBuilder;
        if (table === "meal_plans") return updateBuilder;
        if (table === "multi_day_plan_days") return linkBuilder;
        return createQueryBuilder();
      });

      vi.mocked(MealPlanService.createMealPlan).mockResolvedValueOnce(mockDayPlan1 as any);

      await createMultiDayPlan(commandWithoutNames, userId, mockSupabase);

      expect(MealPlanService.createMealPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Plan - Day 1",
        }),
        userId,
        mockSupabase
      );
    });

    it("should handle database error during plan creation", async () => {
      const insertBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Insert failed", code: "PGRST116" },
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(insertBuilder);

      await expect(createMultiDayPlan(validCommand, userId, mockSupabase)).rejects.toThrow(DatabaseError);
      await expect(createMultiDayPlan(validCommand, userId, mockSupabase)).rejects.toThrow(
        "Failed to create multi-day plan"
      );
    });

    it("should handle database error during day plan creation", async () => {
      const insertBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMultiDayPlan, error: null }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(insertBuilder);

      vi.mocked(MealPlanService.createMealPlan).mockRejectedValueOnce(
        new DatabaseError("Failed to create meal plan")
      );

      await expect(createMultiDayPlan(validCommand, userId, mockSupabase)).rejects.toThrow(DatabaseError);
    });

    it("should handle database error during day plan linking", async () => {
      const insertBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMultiDayPlan, error: null }),
      };

      const updateBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      const linkBuilder = {
        insert: vi.fn().mockResolvedValue({
          error: { message: "Link failed", code: "PGRST116" },
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "multi_day_plans") return insertBuilder;
        if (table === "meal_plans") return updateBuilder;
        if (table === "multi_day_plan_days") return linkBuilder;
        return createQueryBuilder();
      });

      vi.mocked(MealPlanService.createMealPlan).mockResolvedValue(mockDayPlan1 as any);

      const error = await createMultiDayPlan(validCommand, userId, mockSupabase).catch((e) => e);
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.message).toContain("Failed to link day plan");
    });

    it("should handle database error during is_day_plan update", async () => {
      const insertBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMultiDayPlan, error: null }),
      };

      const updateBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: { message: "Update failed", code: "PGRST116" },
        }),
      };

      const linkBuilder = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "multi_day_plans") return insertBuilder;
        if (table === "meal_plans") return updateBuilder;
        if (table === "multi_day_plan_days") return linkBuilder;
        return createQueryBuilder();
      });

      vi.mocked(MealPlanService.createMealPlan).mockResolvedValue(mockDayPlan1 as any);

      const error = await createMultiDayPlan(validCommand, userId, mockSupabase).catch((e) => e);
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.message).toContain("Failed to mark meal plan as day plan");
    });
  });

  describe("getMultiDayPlanById", () => {
    const mockMultiDayPlan = {
      id: "multi-day-plan-id",
      name: "Test Plan",
      number_of_days: 2,
      common_exclusions_guidelines: "No dairy",
      common_allergens: ["peanuts"],
      user_id: userId,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    const mockDayPlan1 = {
      id: "day-plan-1",
      name: "Day 1",
      user_id: userId,
      plan_content: {
        daily_summary: { kcal: 2000, proteins: 150, fats: 65, carbs: 250 },
        meals: [],
      },
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    const mockDayPlan2 = {
      id: "day-plan-2",
      name: "Day 2",
      user_id: userId,
      plan_content: {
        daily_summary: { kcal: 2000, proteins: 150, fats: 65, carbs: 250 },
        meals: [],
      },
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    it("should return plan with all linked day plans", async () => {
      const selectBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMultiDayPlan, error: null }),
      };

      const linksBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { day_number: 1, day_plan_id: "day-plan-1" },
            { day_number: 2, day_plan_id: "day-plan-2" },
          ],
          error: null,
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "multi_day_plans") return selectBuilder;
        if (table === "multi_day_plan_days") return linksBuilder;
        return createQueryBuilder();
      });

      vi.mocked(MealPlanService.getMealPlanById)
        .mockResolvedValueOnce(mockDayPlan1 as any)
        .mockResolvedValueOnce(mockDayPlan2 as any);

      const result = await getMultiDayPlanById("multi-day-plan-id", userId, mockSupabase);

      expect(result.id).toBe("multi-day-plan-id");
      expect(result.days).toHaveLength(2);
    });

    it("should sort days by day_number", async () => {
      const selectBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMultiDayPlan, error: null }),
      };

      const linksBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { day_number: 2, day_plan_id: "day-plan-2" },
            { day_number: 1, day_plan_id: "day-plan-1" },
          ],
          error: null,
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "multi_day_plans") return selectBuilder;
        if (table === "multi_day_plan_days") return linksBuilder;
        return createQueryBuilder();
      });

      vi.mocked(MealPlanService.getMealPlanById)
        .mockResolvedValueOnce(mockDayPlan2 as any)
        .mockResolvedValueOnce(mockDayPlan1 as any);

      const result = await getMultiDayPlanById("multi-day-plan-id", userId, mockSupabase);

      expect(result.days[0].day_number).toBe(1);
      expect(result.days[1].day_number).toBe(2);
    });

    it("should parse common_allergens as array", async () => {
      const planWithArray = {
        ...mockMultiDayPlan,
        common_allergens: ["peanuts", "dairy"],
      };

      const selectBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: planWithArray, error: null }),
      };

      const linksBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { day_number: 1, day_plan_id: "day-plan-1" },
          ],
          error: null,
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "multi_day_plans") return selectBuilder;
        if (table === "multi_day_plan_days") return linksBuilder;
        return createQueryBuilder();
      });

      vi.mocked(MealPlanService.getMealPlanById).mockResolvedValueOnce(mockDayPlan1 as any);

      const result = await getMultiDayPlanById("multi-day-plan-id", userId, mockSupabase);

      expect(result.common_allergens).toEqual(["peanuts", "dairy"]);
    });

    it("should parse common_allergens as JSON string", async () => {
      const planWithJsonString = {
        ...mockMultiDayPlan,
        common_allergens: JSON.stringify(["peanuts", "dairy"]),
      };

      const selectBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: planWithJsonString, error: null }),
      };

      const linksBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { day_number: 1, day_plan_id: "day-plan-1" },
          ],
          error: null,
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "multi_day_plans") return selectBuilder;
        if (table === "multi_day_plan_days") return linksBuilder;
        return createQueryBuilder();
      });

      vi.mocked(MealPlanService.getMealPlanById).mockResolvedValueOnce(mockDayPlan1 as any);

      const result = await getMultiDayPlanById("multi-day-plan-id", userId, mockSupabase);

      expect(result.common_allergens).toEqual(["peanuts", "dairy"]);
    });

    it("should handle null common_allergens", async () => {
      const planWithNull = {
        ...mockMultiDayPlan,
        common_allergens: null,
      };

      const selectBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: planWithNull, error: null }),
      };

      const linksBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { day_number: 1, day_plan_id: "day-plan-1" },
          ],
          error: null,
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "multi_day_plans") return selectBuilder;
        if (table === "multi_day_plan_days") return linksBuilder;
        return createQueryBuilder();
      });

      vi.mocked(MealPlanService.getMealPlanById).mockResolvedValueOnce(mockDayPlan1 as any);

      const result = await getMultiDayPlanById("multi-day-plan-id", userId, mockSupabase);

      expect(result.common_allergens).toBeNull();
    });

    it("should throw NotFoundError when plan doesn't exist", async () => {
      const selectBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found", code: "PGRST116" },
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(selectBuilder);

      await expect(getMultiDayPlanById("non-existent-id", userId, mockSupabase)).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when plan has no day links", async () => {
      const selectBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMultiDayPlan, error: null }),
      };

      const linksBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "multi_day_plans") return selectBuilder;
        if (table === "multi_day_plan_days") return linksBuilder;
        return createQueryBuilder();
      });

      await expect(getMultiDayPlanById("multi-day-plan-id", userId, mockSupabase)).rejects.toThrow(NotFoundError);
      await expect(getMultiDayPlanById("multi-day-plan-id", userId, mockSupabase)).rejects.toThrow(
        "No day plans found"
      );
    });

    it("should handle database errors", async () => {
      const selectBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error", code: "PGRST500" },
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(selectBuilder);

      await expect(getMultiDayPlanById("multi-day-plan-id", userId, mockSupabase)).rejects.toThrow(DatabaseError);
    });

    it("should validate user ownership", async () => {
      const selectBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found", code: "PGRST116" },
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(selectBuilder);

      await expect(getMultiDayPlanById("multi-day-plan-id", userId, mockSupabase)).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateMultiDayPlan", () => {
    const mockMultiDayPlan = {
      id: "multi-day-plan-id",
      name: "Test Plan",
      number_of_days: 2,
      common_exclusions_guidelines: "No dairy",
      common_allergens: ["peanuts"],
      user_id: userId,
      source_chat_session_id: "123e4567-e89b-12d3-a456-426614174000",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    const mockDayPlan1 = {
      id: "day-plan-1",
      name: "Day 1",
      user_id: userId,
      plan_content: {
        daily_summary: { kcal: 2000, proteins: 150, fats: 65, carbs: 250 },
        meals: [],
      },
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    it("should update plan name only", async () => {
      // Mock getMultiDayPlanById to return the plan (called at start and end)
      const getPlanSelectBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMultiDayPlan, error: null }),
      };

      const getPlanLinksBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { day_number: 1, day_plan_id: "day-plan-1" },
          ],
          error: null,
        }),
      };

      const updateBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { ...mockMultiDayPlan, name: "Updated Name" }, error: null }),
      };

      const getPlanSelectBuilderUpdated = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { ...mockMultiDayPlan, name: "Updated Name" }, error: null }),
      };

      let callSequence = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "multi_day_plans") {
          callSequence++;
          // First call: getMultiDayPlanById at start
          // Second call: update query
          // Third call: getMultiDayPlanById at end (should return updated plan)
          if (callSequence === 1) return getPlanSelectBuilder;
          if (callSequence === 3) return getPlanSelectBuilderUpdated;
          return updateBuilder;
        }
        if (table === "multi_day_plan_days") return getPlanLinksBuilder;
        return createQueryBuilder();
      });

      vi.mocked(MealPlanService.getMealPlanById).mockResolvedValue(mockDayPlan1 as any);

      const result = await updateMultiDayPlan(
        "multi-day-plan-id",
        { name: "Updated Name" },
        userId,
        mockSupabase
      );

      expect(updateBuilder.update).toHaveBeenCalledWith({ name: "Updated Name" });
      expect(result.name).toBe("Updated Name");
    });

    it("should throw NotFoundError when plan doesn't exist", async () => {
      const selectBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found", code: "PGRST116" },
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(selectBuilder);

      await expect(updateMultiDayPlan("non-existent-id", { name: "Updated" }, userId, mockSupabase)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("deleteMultiDayPlan", () => {
    const mockMultiDayPlan = {
      id: "multi-day-plan-id",
      name: "Test Plan",
    };

    it("should delete plan and all linked day plans", async () => {
      const selectBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMultiDayPlan, error: null }),
      };

      const linksBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            { day_plan_id: "day-plan-1" },
            { day_plan_id: "day-plan-2" },
          ],
          error: null,
        }),
      };

      const deleteLinksBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      let eqCallCount1 = 0;
      const deletePlanBuilder1 = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation(() => {
          eqCallCount1++;
          if (eqCallCount1 === 2) {
            return Promise.resolve({ error: null });
          }
          return deletePlanBuilder1;
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "multi_day_plans") {
          if (selectBuilder.select.mock.calls.length === 0) return selectBuilder;
          return deletePlanBuilder1;
        }
        if (table === "multi_day_plan_days") {
          if (linksBuilder.select.mock.calls.length === 0) return linksBuilder;
          return deleteLinksBuilder;
        }
        return createQueryBuilder();
      });

      vi.mocked(MealPlanService.deleteMealPlan).mockResolvedValue(undefined);

      await deleteMultiDayPlan("multi-day-plan-id", userId, mockSupabase);

      expect(MealPlanService.deleteMealPlan).toHaveBeenCalledTimes(2);
      expect(deleteLinksBuilder.delete).toHaveBeenCalled();
      expect(deletePlanBuilder1.delete).toHaveBeenCalled();
    });

    it("should handle plans with no day links", async () => {
      const selectBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMultiDayPlan, error: null }),
      };

      const linksBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const deleteLinksBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      let eqCallCount2 = 0;
      const deletePlanBuilder2 = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation(() => {
          eqCallCount2++;
          if (eqCallCount2 === 2) {
            return Promise.resolve({ error: null });
          }
          return deletePlanBuilder2;
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "multi_day_plans") {
          if (selectBuilder.select.mock.calls.length === 0) return selectBuilder;
          return deletePlanBuilder2;
        }
        if (table === "multi_day_plan_days") {
          if (linksBuilder.select.mock.calls.length === 0) return linksBuilder;
          return deleteLinksBuilder;
        }
        return createQueryBuilder();
      });

      await deleteMultiDayPlan("multi-day-plan-id", userId, mockSupabase);

      expect(MealPlanService.deleteMealPlan).not.toHaveBeenCalled();
      expect(deletePlanBuilder2.delete).toHaveBeenCalled();
    });

    it("should throw NotFoundError when plan doesn't exist", async () => {
      const selectBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found", code: "PGRST116" },
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(selectBuilder);

      await expect(deleteMultiDayPlan("non-existent-id", userId, mockSupabase)).rejects.toThrow(NotFoundError);
    });

    it("should handle database errors during day plan deletion", async () => {
      const selectBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMultiDayPlan, error: null }),
      };

      const linksBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ day_plan_id: "day-plan-1" }],
          error: null,
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "multi_day_plans") return selectBuilder;
        if (table === "multi_day_plan_days") return linksBuilder;
        return createQueryBuilder();
      });

      vi.mocked(MealPlanService.deleteMealPlan).mockRejectedValueOnce(new DatabaseError("Delete failed"));

      await expect(deleteMultiDayPlan("multi-day-plan-id", userId, mockSupabase)).rejects.toThrow(DatabaseError);
    });

    it("should handle database errors during plan deletion", async () => {
      const selectBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMultiDayPlan, error: null }),
      };

      const linksSelectBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const linksDeleteBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      let multiDayPlansCallCount = 0;
      let eqCallCount3 = 0;
      const deletePlanBuilder3 = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation(() => {
          eqCallCount3++;
          if (eqCallCount3 === 2) {
            return Promise.resolve({
              error: { message: "Delete failed", code: "PGRST116" },
            });
          }
          return deletePlanBuilder3;
        }),
      };

      let multiDayPlanDaysCallCount = 0;
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "multi_day_plans") {
          multiDayPlansCallCount++;
          if (multiDayPlansCallCount === 1) return selectBuilder;
          return deletePlanBuilder3;
        }
        if (table === "multi_day_plan_days") {
          multiDayPlanDaysCallCount++;
          if (multiDayPlanDaysCallCount === 1) return linksSelectBuilder;
          return linksDeleteBuilder;
        }
        return createQueryBuilder();
      });

      await expect(deleteMultiDayPlan("multi-day-plan-id", userId, mockSupabase)).rejects.toThrow(DatabaseError);
    });

    it("should validate user ownership", async () => {
      const selectBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found", code: "PGRST116" },
        }),
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(selectBuilder);

      await expect(deleteMultiDayPlan("multi-day-plan-id", userId, mockSupabase)).rejects.toThrow(NotFoundError);
    });
  });
});

