import { describe, it, expect } from "vitest";
import { parseJsonMealPlan, extractComments, removeJsonFromMessage } from "@/lib/utils/meal-plan-parser";

describe("meal-plan-parser", () => {
  describe("parseJsonMealPlan", () => {
    describe("complete valid JSON structure", () => {
      it("should parse complete meal plan with daily summary and multiple meals", () => {
        const message = `{
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
                "ingredients": "Eggs, toast, butter",
                "preparation": "Scramble eggs and toast bread",
                "summary": {
                  "kcal": 500,
                  "protein": 30,
                  "fat": 20,
                  "carb": 50
                }
              },
              {
                "name": "Lunch",
                "ingredients": "Chicken, rice, vegetables",
                "preparation": "Grill chicken and steam vegetables",
                "summary": {
                  "kcal": 750,
                  "protein": 60,
                  "fat": 25,
                  "carb": 80
                }
              }
            ]
          }
        }`;

        const result = parseJsonMealPlan(message);

        expect(result.dailySummary).toEqual({
          kcal: 2000,
          proteins: 150,
          fats: 65,
          carbs: 250,
        });

        expect(result.meals).toHaveLength(2);
        expect(result.meals[0]).toEqual({
          name: "Breakfast",
          ingredients: "Eggs, toast, butter",
          preparation: "Scramble eggs and toast bread",
          summary: {
            kcal: 500,
            p: 30,
            f: 20,
            c: 50,
          },
        });
        expect(result.meals[1]).toEqual({
          name: "Lunch",
          ingredients: "Chicken, rice, vegetables",
          preparation: "Grill chicken and steam vegetables",
          summary: {
            kcal: 750,
            p: 60,
            f: 25,
            c: 80,
          },
        });
      });

      it("should parse decimal values and round them correctly", () => {
        const message = `{
          "meal_plan": {
            "daily_summary": {
              "kcal": 1999.7,
              "proteins": 149.8,
              "fats": 64.9,
              "carbs": 249.3
            },
            "meals": [
              {
                "name": "Breakfast",
                "ingredients": "Eggs",
                "preparation": "Cook",
                "summary": {
                  "kcal": 499.6,
                  "protein": 29.7,
                  "fat": 19.5,
                  "carb": 49.9
                }
              }
            ]
          }
        }`;

        const result = parseJsonMealPlan(message);

        expect(result.dailySummary).toEqual({
          kcal: 2000,
          proteins: 150,
          fats: 65,
          carbs: 249,
        });

        expect(result.meals[0].summary).toEqual({
          kcal: 500,
          p: 30,
          f: 20,
          c: 50,
        });
      });

      it("should map JSON field names to internal types (protein->p, fat->f, carb->c)", () => {
        const message = `{
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
                "ingredients": "Test ingredients",
                "preparation": "Test prep",
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

        const result = parseJsonMealPlan(message);

        expect(result.meals[0].summary).toEqual({
          kcal: 500,
          p: 30, // protein -> p
          f: 20, // fat -> f
          c: 50, // carb -> c
        });
      });

      it("should trim whitespace from string fields", () => {
        const message = `{
          "meal_plan": {
            "daily_summary": {
              "kcal": 2000,
              "proteins": 150,
              "fats": 65,
              "carbs": 250
            },
            "meals": [
              {
                "name": "  Breakfast  ",
                "ingredients": "  Eggs, toast  ",
                "preparation": "  Cook eggs  ",
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

        const result = parseJsonMealPlan(message);

        expect(result.meals[0].name).toBe("Breakfast");
        expect(result.meals[0].ingredients).toBe("Eggs, toast");
        expect(result.meals[0].preparation).toBe("Cook eggs");
      });
    });

    describe("JSON extraction from messages", () => {
      it("should extract JSON when message starts with {", () => {
        const message = `{
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
                "ingredients": "Eggs",
                "preparation": "Cook",
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

        const result = parseJsonMealPlan(message);

        expect(result.meals).toHaveLength(1);
        expect(result.meals[0].name).toBe("Breakfast");
      });

      it("should extract JSON when embedded in text", () => {
        const message = `Here's your meal plan:
        {
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
                "ingredients": "Eggs",
                "preparation": "Cook",
                "summary": {
                  "kcal": 500,
                  "protein": 30,
                  "fat": 20,
                  "carb": 50
                }
              }
            ]
          }
        }
        Hope you enjoy it!`;

        const result = parseJsonMealPlan(message);

        expect(result.meals).toHaveLength(1);
        expect(result.meals[0].name).toBe("Breakfast");
      });
    });

    describe("validation errors", () => {
      it("should throw error when meal_plan field is missing", () => {
        const message = `{
          "wrong_field": {
            "daily_summary": {}
          }
        }`;

        expect(() => parseJsonMealPlan(message)).toThrow("Missing required field: meal_plan");
      });

      it("should throw error when daily_summary is missing", () => {
        const message = `{
          "meal_plan": {
            "meals": []
          }
        }`;

        expect(() => parseJsonMealPlan(message)).toThrow("Missing required field: meal_plan.daily_summary");
      });

      it("should throw error when daily_summary.kcal is missing", () => {
        const message = `{
          "meal_plan": {
            "daily_summary": {
              "proteins": 150,
              "fats": 65,
              "carbs": 250
            },
            "meals": []
          }
        }`;

        expect(() => parseJsonMealPlan(message)).toThrow("daily_summary.kcal must be a positive number");
      });

      it("should throw error when daily_summary.kcal is not a positive number", () => {
        const message = `{
          "meal_plan": {
            "daily_summary": {
              "kcal": 0,
              "proteins": 150,
              "fats": 65,
              "carbs": 250
            },
            "meals": []
          }
        }`;

        expect(() => parseJsonMealPlan(message)).toThrow("daily_summary.kcal must be a positive number");
      });

      it("should throw error when meals array is missing", () => {
        const message = `{
          "meal_plan": {
            "daily_summary": {
              "kcal": 2000,
              "proteins": 150,
              "fats": 65,
              "carbs": 250
            }
          }
        }`;

        expect(() => parseJsonMealPlan(message)).toThrow("meal_plan.meals must be an array");
      });

      it("should throw error when meals array is empty", () => {
        const message = `{
          "meal_plan": {
            "daily_summary": {
              "kcal": 2000,
              "proteins": 150,
              "fats": 65,
              "carbs": 250
            },
            "meals": []
          }
        }`;

        expect(() => parseJsonMealPlan(message)).toThrow("meal_plan.meals array cannot be empty");
      });

      it("should throw error when meal name is missing", () => {
        const message = `{
          "meal_plan": {
            "daily_summary": {
              "kcal": 2000,
              "proteins": 150,
              "fats": 65,
              "carbs": 250
            },
            "meals": [
              {
                "ingredients": "Eggs",
                "preparation": "Cook",
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

        expect(() => parseJsonMealPlan(message)).toThrow("Meal name must be a non-empty string");
      });

      it("should throw error when meal name is empty string", () => {
        const message = `{
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
                "ingredients": "Eggs",
                "preparation": "Cook",
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

        expect(() => parseJsonMealPlan(message)).toThrow("Meal name must be a non-empty string");
      });

      it("should throw error when meal summary is missing", () => {
        const message = `{
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
                "ingredients": "Eggs",
                "preparation": "Cook"
              }
            ]
          }
        }`;

        expect(() => parseJsonMealPlan(message)).toThrow("Missing required field: meal.summary");
      });

      it("should throw error when meal summary.kcal is not positive", () => {
        const message = `{
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
                "ingredients": "Eggs",
                "preparation": "Cook",
                "summary": {
                  "kcal": 0,
                  "protein": 30,
                  "fat": 20,
                  "carb": 50
                }
              }
            ]
          }
        }`;

        expect(() => parseJsonMealPlan(message)).toThrow("Meal summary.kcal must be a positive number");
      });

      it("should throw error when meal summary.protein is negative", () => {
        const message = `{
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
                "ingredients": "Eggs",
                "preparation": "Cook",
                "summary": {
                  "kcal": 500,
                  "protein": -10,
                  "fat": 20,
                  "carb": 50
                }
              }
            ]
          }
        }`;

        expect(() => parseJsonMealPlan(message)).toThrow("Meal summary.protein must be a non-negative number");
      });
    });

    describe("JSON syntax errors", () => {
      it("should throw error when JSON is malformed (missing closing brace)", () => {
        const message = `{
          "meal_plan": {
            "daily_summary": {
              "kcal": 2000
            }
          }
        `;

        expect(() => parseJsonMealPlan(message)).toThrow("Failed to parse JSON");
      });

      it("should throw error when JSON is malformed (invalid syntax)", () => {
        const message = `{
          "meal_plan": {
            "daily_summary": {
              "kcal": 2000,
              "proteins": 150,
            }
          }
        }`;

        expect(() => parseJsonMealPlan(message)).toThrow("Failed to parse JSON");
      });

      it("should throw error when no JSON structure is found", () => {
        const message = "This is just plain text with no JSON at all.";

        expect(() => parseJsonMealPlan(message)).toThrow("No valid JSON structure found");
      });
    });

    describe("type validation", () => {
      it("should throw error when kcal is a string instead of number", () => {
        const message = `{
          "meal_plan": {
            "daily_summary": {
              "kcal": "2000",
              "proteins": 150,
              "fats": 65,
              "carbs": 250
            },
            "meals": []
          }
        }`;

        expect(() => parseJsonMealPlan(message)).toThrow("daily_summary.kcal must be a positive number");
      });

      it("should throw error when meal name is a number instead of string", () => {
        const message = `{
          "meal_plan": {
            "daily_summary": {
              "kcal": 2000,
              "proteins": 150,
              "fats": 65,
              "carbs": 250
            },
            "meals": [
              {
                "name": 123,
                "ingredients": "Eggs",
                "preparation": "Cook",
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

        expect(() => parseJsonMealPlan(message)).toThrow("Meal name must be a non-empty string");
      });

      it("should throw error when meals is not an array", () => {
        const message = `{
          "meal_plan": {
            "daily_summary": {
              "kcal": 2000,
              "proteins": 150,
              "fats": 65,
              "carbs": 250
            },
            "meals": "not an array"
          }
        }`;

        expect(() => parseJsonMealPlan(message)).toThrow("meal_plan.meals must be an array");
      });
    });
  });

  describe("extractComments", () => {
    it("should extract comments from JSON structure", () => {
      const message = `{
        "meal_plan": {
          "daily_summary": {
            "kcal": 2000,
            "proteins": 150,
            "fats": 65,
            "carbs": 250
          },
          "meals": []
        },
        "comments": "This is a comment about the meal plan"
      }`;

      const result = extractComments(message);

      expect(result).toBe("This is a comment about the meal plan");
    });

    it("should return null when comments field is missing", () => {
      const message = `{
        "meal_plan": {
          "daily_summary": {
            "kcal": 2000,
            "proteins": 150,
            "fats": 65,
            "carbs": 250
          },
          "meals": []
        }
      }`;

      const result = extractComments(message);

      expect(result).toBeNull();
    });

    it("should trim whitespace from comments", () => {
      const message = `{
        "meal_plan": {},
        "comments": "  Comment with whitespace  "
      }`;

      const result = extractComments(message);

      expect(result).toBe("Comment with whitespace");
    });

    it("should preserve multiline comments", () => {
      const message = `{
        "meal_plan": {},
        "comments": "Line 1\\nLine 2\\nLine 3"
      }`;

      const result = extractComments(message);

      expect(result).toBe("Line 1\nLine 2\nLine 3");
    });

    it("should return null when comments field is not a string", () => {
      const message = `{
        "meal_plan": {},
        "comments": 123
      }`;

      const result = extractComments(message);

      expect(result).toBeNull();
    });

    it("should extract comments when JSON is embedded in text", () => {
      const message = `Here's the plan:
      {
        "meal_plan": {},
        "comments": "This is a comment"
      }
      Hope you like it!`;

      const result = extractComments(message);

      expect(result).toBe("This is a comment");
    });

    it("should return null when no JSON structure is found", () => {
      const message = "This is just plain text with no JSON at all.";

      const result = extractComments(message);

      expect(result).toBeNull();
    });

    it("should return null when JSON is malformed", () => {
      const message = `{
        "meal_plan": {},
        "comments": "This is a comment"
      `;

      const result = extractComments(message);

      expect(result).toBeNull();
    });
  });

  describe("removeJsonFromMessage", () => {
    it("should remove JSON structure when message starts with {", () => {
      const message = `{
        "meal_plan": {
          "daily_summary": {
            "kcal": 2000,
            "proteins": 150,
            "fats": 65,
            "carbs": 250
          },
          "meals": []
        }
      }`;

      const result = removeJsonFromMessage(message);

      expect(result).not.toContain("meal_plan");
      expect(result).not.toContain("daily_summary");
      expect(result).not.toContain("meals");
    });

    it("should preserve comments content but remove JSON structure", () => {
      const message = `{
        "meal_plan": {
          "daily_summary": {},
          "meals": []
        },
        "comments": "Important note about the plan"
      }`;

      const result = removeJsonFromMessage(message);

      expect(result).toContain("Important note about the plan");
      expect(result).not.toContain("meal_plan");
    });

    it("should remove JSON when embedded in text", () => {
      const message = `Some introductory text
      {
        "meal_plan": {
          "daily_summary": {},
          "meals": []
        }
      }
      Some closing text`;

      const result = removeJsonFromMessage(message);

      expect(result).toContain("Some introductory text");
      expect(result).toContain("Some closing text");
      expect(result).not.toContain("meal_plan");
    });

    it("should clean up excessive whitespace", () => {
      const message = `{
        "meal_plan": {}
      }
      
      
      Text here
      
      
      More text`;

      const result = removeJsonFromMessage(message);

      // Should not have more than two consecutive newlines
      expect(result).not.toMatch(/\n\s*\n\s*\n/);
    });

    it("should preserve comments when they are not included in cleaned output", () => {
      const message = `{
        "meal_plan": {
          "daily_summary": {},
          "meals": []
        },
        "comments": "Important comment"
      }`;

      const result = removeJsonFromMessage(message);

      expect(result).toContain("Important comment");
    });

    it("should handle messages with no JSON structure", () => {
      const message = "This is just plain text with no JSON at all.";

      const result = removeJsonFromMessage(message);

      expect(result).toBe("This is just plain text with no JSON at all.");
    });

    it("should return fallback message when content is empty after cleaning", () => {
      const message = `{
        "meal_plan": {
          "daily_summary": {},
          "meals": []
        }
      }`;

      const result = removeJsonFromMessage(message);

      expect(result).toBe("Meal plan updated above.");
    });

    it("should handle multiline comments properly", () => {
      const message = `{
        "meal_plan": {},
        "comments": "Line 1\\nLine 2\\nLine 3"
      }
      Some text`;

      const result = removeJsonFromMessage(message);

      expect(result).toContain("Line 1");
      expect(result).toContain("Line 2");
      expect(result).toContain("Line 3");
      expect(result).toContain("Some text");
    });

    it("should handle complex message with mixed content", () => {
      const message = `Introduction text here.
      {
        "meal_plan": {
          "daily_summary": {
            "kcal": 2000
          },
          "meals": []
        },
        "comments": "This plan looks good!"
      }
      Closing remarks here.`;

      const result = removeJsonFromMessage(message);

      expect(result).toContain("Introduction text here.");
      expect(result).toContain("This plan looks good!");
      expect(result).toContain("Closing remarks here.");
      expect(result).not.toContain("meal_plan");
    });

    it("should trim the final output", () => {
      const message = `{
        "meal_plan": {}
      }
      Text here
      
      `;

      const result = removeJsonFromMessage(message);

      expect(result).not.toMatch(/^\s/);
      expect(result).not.toMatch(/\s$/);
    });

    it("should handle nested JSON objects correctly", () => {
      const message = `{
        "meal_plan": {
          "nested": {
            "deep": {
              "content": "value"
            }
          }
        }
      }
      Text outside`;

      const result = removeJsonFromMessage(message);

      expect(result).not.toContain("meal_plan");
      expect(result).not.toContain("nested");
      expect(result).not.toContain("deep");
      expect(result).toContain("Text outside");
    });
  });
});
