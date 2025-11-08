import { describe, it, expect } from "vitest";
import { extractCurrentMealPlan } from "@/lib/utils/chat-helpers";
import type { ChatMessage } from "@/types";

describe("extractCurrentMealPlan", () => {
  describe("valid meal plan in last assistant message", () => {
    it("should extract meal plan from last assistant message", () => {
      const messageHistory: ChatMessage[] = [
        { role: "user", content: "Create a meal plan" },
        {
          role: "assistant",
          content: `
            <daily_summary>
              <kcal>2000</kcal>
              <proteins>150</proteins>
              <fats>65</fats>
              <carbs>250</carbs>
            </daily_summary>
            <meals>
              <meal>
                <name>Breakfast</name>
                <ingredients>Eggs, toast</ingredients>
                <preparation>Cook eggs and toast bread</preparation>
                <summary>
                  <kcal>500</kcal>
                  <protein>30</protein>
                  <fat>20</fat>
                  <carb>50</carb>
                </summary>
              </meal>
              <meal>
                <name>Lunch</name>
                <ingredients>Chicken, rice</ingredients>
                <preparation>Grill chicken and cook rice</preparation>
                <summary>
                  <kcal>750</kcal>
                  <protein>60</protein>
                  <fat>25</fat>
                  <carb>80</carb>
                </summary>
              </meal>
            </meals>
          `,
        },
      ];

      const result = extractCurrentMealPlan(messageHistory);

      expect(result).not.toBeNull();
      expect(result?.meals).toHaveLength(2);
      expect(result?.meals[0].name).toBe("Breakfast");
      expect(result?.meals[1].name).toBe("Lunch");
      expect(result?.dailySummary.kcal).toBe(2000);
      expect(result?.dailySummary.proteins).toBe(150);
    });

    it("should use the last assistant message when multiple exist", () => {
      const messageHistory: ChatMessage[] = [
        { role: "user", content: "Create initial plan" },
        {
          role: "assistant",
          content: `
            <meals>
              <meal>
                <name>Old Meal</name>
                <ingredients>Old ingredients</ingredients>
                <preparation>Old preparation</preparation>
                <summary>
                  <kcal>100</kcal>
                  <protein>10</protein>
                  <fat>5</fat>
                  <carb>15</carb>
                </summary>
              </meal>
            </meals>
          `,
        },
        { role: "user", content: "Update the plan" },
        {
          role: "assistant",
          content: `
            <meals>
              <meal>
                <name>New Meal</name>
                <ingredients>New ingredients</ingredients>
                <preparation>New preparation</preparation>
                <summary>
                  <kcal>200</kcal>
                  <protein>20</protein>
                  <fat>10</fat>
                  <carb>30</carb>
                </summary>
              </meal>
            </meals>
          `,
        },
      ];

      const result = extractCurrentMealPlan(messageHistory);

      expect(result).not.toBeNull();
      expect(result?.meals[0].name).toBe("New Meal");
      expect(result?.meals[0].ingredients).toBe("New ingredients");
    });
  });

  describe("no assistant messages", () => {
    it("should return null when message history is empty or only user messages exist", () => {
      const emptyHistory: ChatMessage[] = [];
      const onlyUserMessages: ChatMessage[] = [
        { role: "user", content: "First message" },
        { role: "user", content: "Second message" },
      ];

      expect(extractCurrentMealPlan(emptyHistory)).toBeNull();
      expect(extractCurrentMealPlan(onlyUserMessages)).toBeNull();
    });
  });

  describe("failed parsing", () => {
    it("should return null when meal plan is malformed", () => {
      const messageHistory: ChatMessage[] = [
        {
          role: "assistant",
          // Meal with empty name will fail validation
          content: "<meals><meal><name></name><preparation>Some prep</preparation></meal></meals>",
        },
      ];

      const result = extractCurrentMealPlan(messageHistory);

      // Should return null because name is empty (fails validation)
      expect(result).toBeNull();
    });

    it("should return null when meal plan structure is incomplete", () => {
      const messageHistory: ChatMessage[] = [
        {
          role: "assistant",
          content: "Just some text without any meal plan structure",
        },
      ];

      const result = extractCurrentMealPlan(messageHistory);

      expect(result).toBeNull();
    });

    it("should return null when meal plan has empty name and preparation equals full content", () => {
      // This is the fallback structure - should return null
      const fullContent = "Some message text here";
      const messageHistory: ChatMessage[] = [
        {
          role: "assistant",
          content: fullContent,
        },
      ];

      const result = extractCurrentMealPlan(messageHistory);

      expect(result).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should handle message with only comments (no meal plan XML)", () => {
      const messageHistory: ChatMessage[] = [
        {
          role: "assistant",
          content: "<comments>This is just a comment, no meal plan</comments>",
        },
      ];

      const result = extractCurrentMealPlan(messageHistory);

      expect(result).toBeNull();
    });

    it("should handle empty meal plan (fallback structure)", () => {
      const messageHistory: ChatMessage[] = [
        {
          role: "assistant",
          content: `
            <daily_summary>
              <kcal>2000</kcal>
            </daily_summary>
            Some text without meals
          `,
        },
      ];

      const result = extractCurrentMealPlan(messageHistory);

      // Should return null because fallback structure has empty name
      expect(result).toBeNull();
    });

    it("should handle meal plan with empty meal name", () => {
      const messageHistory: ChatMessage[] = [
        {
          role: "assistant",
          content: `
            <meals>
              <meal>
                <name></name>
                <ingredients>Some ingredients</ingredients>
                <preparation>Some preparation</preparation>
                <summary>
                  <kcal>500</kcal>
                  <protein>30</protein>
                  <fat>20</fat>
                  <carb>50</carb>
                </summary>
              </meal>
            </meals>
          `,
        },
      ];

      const result = extractCurrentMealPlan(messageHistory);

      expect(result).toBeNull(); // Empty name should cause it to return null
    });

    it("should handle meal plan where preparation matches full message content", () => {
      const fullContent = `
        <meals>
          <meal>
            <name>Test Meal</name>
            <ingredients>Ingredients</ingredients>
            <preparation>Preparation</preparation>
            <summary>
              <kcal>500</kcal>
              <protein>30</protein>
              <fat>20</fat>
              <carb>50</carb>
            </summary>
          </meal>
        </meals>
      `;

      const messageHistory: ChatMessage[] = [
        {
          role: "assistant",
          content: fullContent,
        },
      ];

      const result = extractCurrentMealPlan(messageHistory);

      // Should return the parsed meal plan since preparation doesn't match full content
      expect(result).not.toBeNull();
    });
  });

  describe("message history scenarios", () => {
    it("should handle alternating user and assistant messages", () => {
      const messageHistory: ChatMessage[] = [
        { role: "user", content: "Question 1" },
        { role: "assistant", content: "Response 1" },
        { role: "user", content: "Question 2" },
        {
          role: "assistant",
          content: `
            <meals>
              <meal>
                <name>Final Meal</name>
                <ingredients>Final ingredients</ingredients>
                <preparation>Final preparation</preparation>
                <summary>
                  <kcal>500</kcal>
                  <protein>30</protein>
                  <fat>20</fat>
                  <carb>50</carb>
                </summary>
              </meal>
            </meals>
          `,
        },
      ];

      const result = extractCurrentMealPlan(messageHistory);

      expect(result).not.toBeNull();
      expect(result?.meals[0].name).toBe("Final Meal");
    });

    it("should handle message history with multiple assistant messages without meal plans", () => {
      const messageHistory: ChatMessage[] = [
        { role: "assistant", content: "First response" },
        { role: "assistant", content: "Second response" },
        { role: "assistant", content: "Third response" },
      ];

      const result = extractCurrentMealPlan(messageHistory);

      expect(result).toBeNull();
    });
  });

  describe("complex meal plan structures", () => {
    it("should handle meal plan with multiple meals", () => {
      const messageHistory: ChatMessage[] = [
        {
          role: "assistant",
          content: `
            <daily_summary>
              <kcal>2500</kcal>
              <proteins>180</proteins>
              <fats>80</fats>
              <carbs>300</carbs>
            </daily_summary>
            <meals>
              <meal>
                <name>Breakfast</name>
                <ingredients>Eggs, toast</ingredients>
                <preparation>Cook</preparation>
                <summary>
                  <kcal>600</kcal>
                  <protein>40</protein>
                  <fat>25</fat>
                  <carb>60</carb>
                </summary>
              </meal>
              <meal>
                <name>Lunch</name>
                <ingredients>Chicken, rice</ingredients>
                <preparation>Grill</preparation>
                <summary>
                  <kcal>800</kcal>
                  <protein>70</protein>
                  <fat>30</fat>
                  <carb>90</carb>
                </summary>
              </meal>
              <meal>
                <name>Dinner</name>
                <ingredients>Fish, vegetables</ingredients>
                <preparation>Bake</preparation>
                <summary>
                  <kcal>1100</kcal>
                  <protein>70</protein>
                  <fat>25</fat>
                  <carb>150</carb>
                </summary>
              </meal>
            </meals>
          `,
        },
      ];

      const result = extractCurrentMealPlan(messageHistory);

      expect(result).not.toBeNull();
      expect(result?.meals).toHaveLength(3);
      expect(result?.meals.map((m) => m.name)).toEqual(["Breakfast", "Lunch", "Dinner"]);
      expect(result?.dailySummary.kcal).toBe(2500);
    });
  });
});
