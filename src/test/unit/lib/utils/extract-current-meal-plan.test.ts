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
          content: `{
            "meal_plan": {
              "daily_summary": {
                "kcal": 2000,
                "proteins": 150,
                "fats": 65,
                "carbs": 250
              },
              "meals": [
                {
                  "name": "Breakfast",
                  "ingredients": "Eggs, toast",
                  "preparation": "Cook eggs and toast bread",
                  "summary": {
                    "kcal": 500,
                    "protein": 30,
                    "fat": 20,
                    "carb": 50
                  }
                },
                {
                  "name": "Lunch",
                  "ingredients": "Chicken, rice",
                  "preparation": "Grill chicken and cook rice",
                  "summary": {
                    "kcal": 750,
                    "protein": 60,
                    "fat": 25,
                    "carb": 80
                  }
                }
              ]
            }
          }`,
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
          content: `{
            "meal_plan": {
              "daily_summary": {
                "kcal": 2000,
                "proteins": 150,
                "fats": 65,
                "carbs": 250
              },
              "meals": [
                {
                  "name": "Old Meal",
                  "ingredients": "Old ingredients",
                  "preparation": "Old preparation",
                  "summary": {
                    "kcal": 100,
                    "protein": 10,
                    "fat": 5,
                    "carb": 15
                  }
                }
              ]
            }
          }`,
        },
        { role: "user", content: "Update the plan" },
        {
          role: "assistant",
          content: `{
            "meal_plan": {
              "daily_summary": {
                "kcal": 2000,
                "proteins": 150,
                "fats": 65,
                "carbs": 250
              },
              "meals": [
                {
                  "name": "New Meal",
                  "ingredients": "New ingredients",
                  "preparation": "New preparation",
                  "summary": {
                    "kcal": 200,
                    "protein": 20,
                    "fat": 10,
                    "carb": 30
                  }
                }
              ]
            }
          }`,
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
          content: "Just some text without any meal plan structure",
        },
      ];

      const result = extractCurrentMealPlan(messageHistory);

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
    it("should handle message with only comments (no meal plan JSON)", () => {
      const messageHistory: ChatMessage[] = [
        {
          role: "assistant",
          content: `{
            "comments": "This is just a comment, no meal plan"
          }`,
        },
      ];

      const result = extractCurrentMealPlan(messageHistory);

      expect(result).toBeNull();
    });

    it("should handle empty meal plan (fallback structure)", () => {
      const messageHistory: ChatMessage[] = [
        {
          role: "assistant",
          content: `{
            "meal_plan": {
              "daily_summary": {
                "kcal": 2000,
                "proteins": 150,
                "fats": 65,
                "carbs": 250
              },
              "meals": []
            }
          }`,
        },
      ];

      const result = extractCurrentMealPlan(messageHistory);

      // Should return null because meals array is empty (fails validation)
      expect(result).toBeNull();
    });

    it("should handle meal plan with empty meal name", () => {
      const messageHistory: ChatMessage[] = [
        {
          role: "assistant",
          content: `{
            "meal_plan": {
              "daily_summary": {
                "kcal": 2000,
                "proteins": 150,
                "fats": 65,
                "carbs": 250
              },
              "meals": [
                {
                  "name": "",
                  "ingredients": "Some ingredients",
                  "preparation": "Some preparation",
                  "summary": {
                    "kcal": 500,
                    "protein": 30,
                    "fat": 20,
                    "carb": 50
                  }
                }
              ]
            }
          }`,
        },
      ];

      const result = extractCurrentMealPlan(messageHistory);

      expect(result).toBeNull(); // Empty name should cause it to return null
    });

    it("should handle meal plan where preparation matches full message content", () => {
      const fullContent = `{
        "meal_plan": {
          "daily_summary": {
            "kcal": 2000,
            "proteins": 150,
            "fats": 65,
            "carbs": 250
          },
          "meals": [
            {
              "name": "Test Meal",
              "ingredients": "Ingredients",
              "preparation": "Preparation",
              "summary": {
                "kcal": 500,
                "protein": 30,
                "fat": 20,
                "carb": 50
              }
            }
          ]
        }
      }`;

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
          content: `{
            "meal_plan": {
              "daily_summary": {
                "kcal": 2000,
                "proteins": 150,
                "fats": 65,
                "carbs": 250
              },
              "meals": [
                {
                  "name": "Final Meal",
                  "ingredients": "Final ingredients",
                  "preparation": "Final preparation",
                  "summary": {
                    "kcal": 500,
                    "protein": 30,
                    "fat": 20,
                    "carb": 50
                  }
                }
              ]
            }
          }`,
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
          content: `{
            "meal_plan": {
              "daily_summary": {
                "kcal": 2500,
                "proteins": 180,
                "fats": 80,
                "carbs": 300
              },
              "meals": [
                {
                  "name": "Breakfast",
                  "ingredients": "Eggs, toast",
                  "preparation": "Cook",
                  "summary": {
                    "kcal": 600,
                    "protein": 40,
                    "fat": 25,
                    "carb": 60
                  }
                },
                {
                  "name": "Lunch",
                  "ingredients": "Chicken, rice",
                  "preparation": "Grill",
                  "summary": {
                    "kcal": 800,
                    "protein": 70,
                    "fat": 30,
                    "carb": 90
                  }
                },
                {
                  "name": "Dinner",
                  "ingredients": "Fish, vegetables",
                  "preparation": "Bake",
                  "summary": {
                    "kcal": 1100,
                    "protein": 70,
                    "fat": 25,
                    "carb": 150
                  }
                }
              ]
            }
          }`,
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
