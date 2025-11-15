import { describe, it, expect } from "vitest";
import { parseJsonMultiDayPlan } from "@/lib/utils/meal-plan-parser";

describe("multi-day-plan-parser", () => {
  describe("parseJsonMultiDayPlan", () => {
    describe("complete valid JSON structure", () => {
      it("should parse complete multi-day plan with 1 day", () => {
        const message = `{
          "multi_day_plan": {
            "days": [
              {
                "day_number": 1,
                "name": "Day 1",
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
                      "preparation": "Cook eggs",
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
            ],
            "summary": {
              "number_of_days": 1,
              "average_kcal": 2000,
              "average_proteins": 150,
              "average_fats": 65,
              "average_carbs": 250
            }
          }
        }`;

        const result = parseJsonMultiDayPlan(message);

        expect(result.days).toHaveLength(1);
        expect(result.days[0]).toEqual({
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
                ingredients: "Eggs, toast",
                preparation: "Cook eggs",
                summary: {
                  kcal: 500,
                  p: 30,
                  f: 20,
                  c: 50,
                },
              },
            ],
          },
        });
        expect(result.summary).toEqual({
          number_of_days: 1,
          average_kcal: 2000,
          average_proteins: 150,
          average_fats: 65,
          average_carbs: 250,
        });
      });

      it("should parse complete multi-day plan with 7 days", () => {
        const days = Array.from({ length: 7 }, (_, i) => ({
          day_number: i + 1,
          name: `Day ${i + 1}`,
          meal_plan: {
            daily_summary: {
              kcal: 2000 + i * 100,
              proteins: 150 + i * 10,
              fats: 65 + i * 5,
              carbs: 250 + i * 15,
            },
            meals: [
              {
                name: `Breakfast Day ${i + 1}`,
                ingredients: "Eggs",
                preparation: "Cook",
                summary: {
                  kcal: 500,
                  protein: 30,
                  fat: 20,
                  carb: 50,
                },
              },
            ],
          },
        }));

        const message = JSON.stringify({
          multi_day_plan: {
            days,
            summary: {
              number_of_days: 7,
              average_kcal: 2300,
              average_proteins: 180,
              average_fats: 90,
              average_carbs: 340,
            },
          },
        });

        const result = parseJsonMultiDayPlan(message);

        expect(result.days).toHaveLength(7);
        expect(result.summary.number_of_days).toBe(7);
        result.days.forEach((day, index) => {
          expect(day.day_number).toBe(index + 1);
          expect(day.name).toBe(`Day ${index + 1}`);
        });
      });

      it("should handle optional day names", () => {
        const message = `{
          "multi_day_plan": {
            "days": [
              {
                "day_number": 1,
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
            ],
            "summary": {
              "number_of_days": 1,
              "average_kcal": 2000,
              "average_proteins": 150,
              "average_fats": 65,
              "average_carbs": 250
            }
          }
        }`;

        const result = parseJsonMultiDayPlan(message);

        expect(result.days[0].name).toBeUndefined();
      });

      it("should map JSON fields (protein/fat/carb → p/f/c)", () => {
        const message = `{
          "multi_day_plan": {
            "days": [
              {
                "day_number": 1,
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
                      "ingredients": "Test",
                      "preparation": "Test",
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
            ],
            "summary": {
              "number_of_days": 1,
              "average_kcal": 2000,
              "average_proteins": 150,
              "average_fats": 65,
              "average_carbs": 250
            }
          }
        }`;

        const result = parseJsonMultiDayPlan(message);

        expect(result.days[0].plan_content.meals[0].summary).toEqual({
          kcal: 500,
          p: 30, // protein -> p
          f: 20, // fat -> f
          c: 50, // carb -> c
        });
      });

      it("should round decimal values correctly", () => {
        const message = `{
          "multi_day_plan": {
            "days": [
              {
                "day_number": 1,
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
              }
            ],
            "summary": {
              "number_of_days": 1,
              "average_kcal": 1999.7,
              "average_proteins": 149.8,
              "average_fats": 64.9,
              "average_carbs": 249.3
            }
          }
        }`;

        const result = parseJsonMultiDayPlan(message);

        expect(result.days[0].plan_content.daily_summary).toEqual({
          kcal: 2000,
          proteins: 150,
          fats: 65,
          carbs: 249,
        });

        expect(result.days[0].plan_content.meals[0].summary).toEqual({
          kcal: 500,
          p: 30,
          f: 20,
          c: 50,
        });

        expect(result.summary).toEqual({
          number_of_days: 1,
          average_kcal: 2000,
          average_proteins: 150,
          average_fats: 65,
          average_carbs: 249,
        });
      });

      it("should accept valid day_number range (1-7)", () => {
        const validMessage = `{
          "multi_day_plan": {
            "days": [
              {
                "day_number": 1,
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
            ],
            "summary": {
              "number_of_days": 1,
              "average_kcal": 2000,
              "average_proteins": 150,
              "average_fats": 65,
              "average_carbs": 250
            }
          }
        }`;

        expect(() => parseJsonMultiDayPlan(validMessage)).not.toThrow();
      });

    });

    describe("JSON extraction from messages", () => {
      it("should extract JSON from messages with extra text", () => {
        const message = `Here's your multi-day meal plan:
        {
          "multi_day_plan": {
            "days": [
              {
                "day_number": 1,
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
            ],
            "summary": {
              "number_of_days": 1,
              "average_kcal": 2000,
              "average_proteins": 150,
              "average_fats": 65,
              "average_carbs": 250
            }
          }
        }
        Hope you enjoy it!`;

        const result = parseJsonMultiDayPlan(message);
        expect(result.days).toHaveLength(1);
        expect(result.days[0].day_number).toBe(1);
      });

      it("should handle messages starting with JSON", () => {
        const message = `{
          "multi_day_plan": {
            "days": [
              {
                "day_number": 1,
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
            ],
            "summary": {
              "number_of_days": 1,
              "average_kcal": 2000,
              "average_proteins": 150,
              "average_fats": 65,
              "average_carbs": 250
            }
          }
        }`;

        const result = parseJsonMultiDayPlan(message);
        expect(result.days).toHaveLength(1);
      });

      it("should handle messages with JSON in middle", () => {
        const message = `Some text before
        {
          "multi_day_plan": {
            "days": [
              {
                "day_number": 1,
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
            ],
            "summary": {
              "number_of_days": 1,
              "average_kcal": 2000,
              "average_proteins": 150,
              "average_fats": 65,
              "average_carbs": 250
            }
          }
        }
        Some text after`;

        const result = parseJsonMultiDayPlan(message);
        expect(result.days).toHaveLength(1);
      });
    });

    describe("validation errors", () => {
      it("should throw error for missing multi_day_plan key", () => {
        const message = `{
          "wrong_key": {
            "days": []
          }
        }`;

        expect(() => parseJsonMultiDayPlan(message)).toThrow("Missing required field: multi_day_plan");
      });

      it("should throw error for empty days array", () => {
        const message = `{
          "multi_day_plan": {
            "days": [],
            "summary": {
              "number_of_days": 0,
              "average_kcal": 0,
              "average_proteins": 0,
              "average_fats": 0,
              "average_carbs": 0
            }
          }
        }`;

        expect(() => parseJsonMultiDayPlan(message)).toThrow("multi_day_plan.days array cannot be empty");
      });

      it("should throw error for day_number < 1", () => {
        const message = `{
          "multi_day_plan": {
            "days": [
              {
                "day_number": 0,
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
            ],
            "summary": {
              "number_of_days": 1,
              "average_kcal": 2000,
              "average_proteins": 150,
              "average_fats": 65,
              "average_carbs": 250
            }
          }
        }`;

        expect(() => parseJsonMultiDayPlan(message)).toThrow("day_number must be a number between 1 and 7");
      });

      it("should throw error for day_number > 7", () => {
        const message = `{
          "multi_day_plan": {
            "days": [
              {
                "day_number": 8,
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
            ],
            "summary": {
              "number_of_days": 1,
              "average_kcal": 2000,
              "average_proteins": 150,
              "average_fats": 65,
              "average_carbs": 250
            }
          }
        }`;

        expect(() => parseJsonMultiDayPlan(message)).toThrow("day_number must be a number between 1 and 7");
      });

      it("should throw error for missing daily_summary", () => {
        const message = `{
          "multi_day_plan": {
            "days": [
              {
                "day_number": 1,
                "meal_plan": {
                  "meals": []
                }
              }
            ],
            "summary": {
              "number_of_days": 1,
              "average_kcal": 2000,
              "average_proteins": 150,
              "average_fats": 65,
              "average_carbs": 250
            }
          }
        }`;

        expect(() => parseJsonMultiDayPlan(message)).toThrow("Missing required field: meal_plan.daily_summary");
      });

      it("should throw error for missing/empty meals", () => {
        const messageNoMeals = `{
          "multi_day_plan": {
            "days": [
              {
                "day_number": 1,
                "meal_plan": {
                  "daily_summary": {
                    "kcal": 2000,
                    "proteins": 150,
                    "fats": 65,
                    "carbs": 250
                  }
                }
              }
            ],
            "summary": {
              "number_of_days": 1,
              "average_kcal": 2000,
              "average_proteins": 150,
              "average_fats": 65,
              "average_carbs": 250
            }
          }
        }`;

        expect(() => parseJsonMultiDayPlan(messageNoMeals)).toThrow("meal_plan.meals must be an array");

        const messageEmptyMeals = `{
          "multi_day_plan": {
            "days": [
              {
                "day_number": 1,
                "meal_plan": {
                  "daily_summary": {
                    "kcal": 2000,
                    "proteins": 150,
                    "fats": 65,
                    "carbs": 250
                  },
                  "meals": []
                }
              }
            ],
            "summary": {
              "number_of_days": 1,
              "average_kcal": 2000,
              "average_proteins": 150,
              "average_fats": 65,
              "average_carbs": 250
            }
          }
        }`;

        expect(() => parseJsonMultiDayPlan(messageEmptyMeals)).toThrow("meal_plan.meals array cannot be empty");
      });

      it("should throw error for malformed JSON", () => {
        const message = `{
          "multi_day_plan": {
            "days": [
              {
                "day_number": 1,
                invalid json
              }
            ]
          }
        }`;

        expect(() => parseJsonMultiDayPlan(message)).toThrow("Failed to parse JSON");
      });

      it("should throw error when summary.number_of_days is invalid", () => {
        const message = `{
          "multi_day_plan": {
            "days": [
              {
                "day_number": 1,
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
            ],
            "summary": {
              "number_of_days": 0,
              "average_kcal": 2000,
              "average_proteins": 150,
              "average_fats": 65,
              "average_carbs": 250
            }
          }
        }`;

        expect(() => parseJsonMultiDayPlan(message)).toThrow("summary.number_of_days must be a number between 1 and 7");
      });

      it("should throw error when meal name is empty", () => {
        const message = `{
          "multi_day_plan": {
            "days": [
              {
                "day_number": 1,
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
              }
            ],
            "summary": {
              "number_of_days": 1,
              "average_kcal": 2000,
              "average_proteins": 150,
              "average_fats": 65,
              "average_carbs": 250
            }
          }
        }`;

        expect(() => parseJsonMultiDayPlan(message)).toThrow("Meal name must be a non-empty string");
      });

      it("should throw error when daily_summary.kcal is not positive", () => {
        const message = `{
          "multi_day_plan": {
            "days": [
              {
                "day_number": 1,
                "meal_plan": {
                  "daily_summary": {
                    "kcal": 0,
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
            ],
            "summary": {
              "number_of_days": 1,
              "average_kcal": 2000,
              "average_proteins": 150,
              "average_fats": 65,
              "average_carbs": 250
            }
          }
        }`;

        expect(() => parseJsonMultiDayPlan(message)).toThrow("daily_summary.kcal must be a positive number");
      });
    });
  });
});

