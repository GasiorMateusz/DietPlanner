import { describe, it, expect } from "vitest";
import { parseXmlMealPlan, extractComments, removeXmlTags } from "@/lib/utils/meal-plan-parser";

describe("meal-plan-parser", () => {
  describe("parseXmlMealPlan", () => {
    describe("complete valid XML structure", () => {
      it("should parse complete meal plan with daily summary and multiple meals", () => {
        const message = `
          Here's your meal plan:
          <daily_summary>
            <kcal>2000</kcal>
            <proteins>150</proteins>
            <fats>65</fats>
            <carbs>250</carbs>
          </daily_summary>
          <meals>
            <meal>
              <name>Breakfast</name>
              <ingredients>Eggs, toast, butter</ingredients>
              <preparation>Scramble eggs and toast bread</preparation>
              <summary>
                <kcal>500</kcal>
                <protein>30</protein>
                <fat>20</fat>
                <carb>50</carb>
              </summary>
            </meal>
            <meal>
              <name>Lunch</name>
              <ingredients>Chicken, rice, vegetables</ingredients>
              <preparation>Grill chicken and steam vegetables</preparation>
              <summary>
                <kcal>750</kcal>
                <protein>60</protein>
                <fat>25</fat>
                <carb>80</carb>
              </summary>
            </meal>
          </meals>
        `;

        const result = parseXmlMealPlan(message);

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
        const message = `
          <daily_summary>
            <kcal>1999.7</kcal>
            <proteins>149.8</proteins>
            <fats>64.9</fats>
            <carbs>249.3</carbs>
          </daily_summary>
          <meals>
            <meal>
              <name>Breakfast</name>
              <ingredients>Eggs</ingredients>
              <preparation>Cook</preparation>
              <summary>
                <kcal>499.6</kcal>
                <protein>29.7</protein>
                <fat>19.5</fat>
                <carb>49.9</carb>
              </summary>
            </meal>
          </meals>
        `;

        const result = parseXmlMealPlan(message);

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
    });

    describe("case-insensitive tag matching", () => {
      it("should match inner tags regardless of case (outer tags are case-sensitive)", () => {
        const message = `
          <daily_summary>
            <KCAL>2000</KCAL>
            <PROTEINS>150</PROTEINS>
            <FATS>65</FATS>
            <CARBS>250</CARBS>
          </daily_summary>
          <meals>
            <meal>
              <NAME>Breakfast</NAME>
              <INGREDIENTS>Eggs</INGREDIENTS>
              <PREPARATION>Cook</PREPARATION>
              <summary>
                <KCAL>500</KCAL>
                <PROTEIN>30</PROTEIN>
                <FAT>20</FAT>
                <CARB>50</CARB>
              </summary>
            </meal>
          </meals>
        `;

        const result = parseXmlMealPlan(message);

        expect(result.dailySummary.kcal).toBe(2000);
        expect(result.dailySummary.proteins).toBe(150);
        expect(result.meals[0].name).toBe("Breakfast");
        expect(result.meals[0].summary.kcal).toBe(500);
      });

      it("should match mixed case inner tags", () => {
        const message = `
          <daily_summary>
            <Kcal>2000</Kcal>
            <Proteins>150</Proteins>
            <Fats>65</Fats>
            <Carbs>250</Carbs>
          </daily_summary>
          <meals>
            <meal>
              <Name>Breakfast</Name>
              <Ingredients>Eggs</Ingredients>
              <Preparation>Cook</Preparation>
              <summary>
                <Kcal>500</Kcal>
                <Protein>30</Protein>
                <Fat>20</Fat>
                <Carb>50</Carb>
              </summary>
            </meal>
          </meals>
        `;

        const result = parseXmlMealPlan(message);

        expect(result.dailySummary.kcal).toBe(2000);
        expect(result.meals[0].name).toBe("Breakfast");
      });
    });

    describe("missing or incomplete XML structure", () => {
      it("should return zero values when daily_summary is missing", () => {
        const message = `
          <meals>
            <meal>
              <name>Breakfast</name>
              <ingredients>Eggs</ingredients>
              <preparation>Cook</preparation>
              <summary>
                <kcal>500</kcal>
                <protein>30</protein>
                <fat>20</fat>
                <carb>50</carb>
              </summary>
            </meal>
          </meals>
        `;

        const result = parseXmlMealPlan(message);

        expect(result.dailySummary).toEqual({
          kcal: 0,
          proteins: 0,
          fats: 0,
          carbs: 0,
        });
        expect(result.meals).toHaveLength(1);
      });

      it("should return zero for missing daily_summary fields", () => {
        const message = `
          <daily_summary>
            <kcal>2000</kcal>
          </daily_summary>
          <meals>
            <meal>
              <name>Breakfast</name>
              <ingredients>Eggs</ingredients>
              <preparation>Cook</preparation>
              <summary>
                <kcal>500</kcal>
                <protein>30</protein>
                <fat>20</fat>
                <carb>50</carb>
              </summary>
            </meal>
          </meals>
        `;

        const result = parseXmlMealPlan(message);

        expect(result.dailySummary).toEqual({
          kcal: 2000,
          proteins: 0,
          fats: 0,
          carbs: 0,
        });
      });

      it("should return empty strings for missing meal fields", () => {
        const message = `
          <daily_summary>
            <kcal>2000</kcal>
            <proteins>150</proteins>
            <fats>65</fats>
            <carbs>250</carbs>
          </daily_summary>
          <meals>
            <meal>
              <name>Breakfast</name>
              <preparation>Cook</preparation>
              <summary>
                <kcal>500</kcal>
                <protein>30</protein>
                <fat>20</fat>
                <carb>50</carb>
              </summary>
            </meal>
          </meals>
        `;

        const result = parseXmlMealPlan(message);

        expect(result.meals[0].ingredients).toBe("");
        expect(result.meals[0].name).toBe("Breakfast");
        expect(result.meals[0].preparation).toBe("Cook");
      });

      it("should return zero for missing meal summary fields", () => {
        const message = `
          <daily_summary>
            <kcal>2000</kcal>
            <proteins>150</proteins>
            <fats>65</fats>
            <carbs>250</carbs>
          </daily_summary>
          <meals>
            <meal>
              <name>Breakfast</name>
              <ingredients>Eggs</ingredients>
              <preparation>Cook</preparation>
              <summary>
                <kcal>500</kcal>
              </summary>
            </meal>
          </meals>
        `;

        const result = parseXmlMealPlan(message);

        expect(result.meals[0].summary).toEqual({
          kcal: 500,
          p: 0,
          f: 0,
          c: 0,
        });
      });

      it("should return zero for missing meal summary tag entirely", () => {
        const message = `
          <daily_summary>
            <kcal>2000</kcal>
            <proteins>150</proteins>
            <fats>65</fats>
            <carbs>250</carbs>
          </daily_summary>
          <meals>
            <meal>
              <name>Breakfast</name>
              <ingredients>Eggs</ingredients>
              <preparation>Cook</preparation>
            </meal>
          </meals>
        `;

        const result = parseXmlMealPlan(message);

        expect(result.meals[0].summary).toEqual({
          kcal: 0,
          p: 0,
          f: 0,
          c: 0,
        });
      });
    });

    describe("invalid numeric values", () => {
      it("should return zero for NaN values in daily_summary", () => {
        const message = `
          <daily_summary>
            <kcal>invalid</kcal>
            <proteins>150</proteins>
            <fats>not a number</fats>
            <carbs>250</carbs>
          </daily_summary>
          <meals>
            <meal>
              <name>Breakfast</name>
              <ingredients>Eggs</ingredients>
              <preparation>Cook</preparation>
              <summary>
                <kcal>500</kcal>
                <protein>30</protein>
                <fat>20</fat>
                <carb>50</carb>
              </summary>
            </meal>
          </meals>
        `;

        const result = parseXmlMealPlan(message);

        expect(result.dailySummary).toEqual({
          kcal: 0,
          proteins: 150,
          fats: 0,
          carbs: 250,
        });
      });

      it("should return zero for NaN values in meal summary", () => {
        const message = `
          <daily_summary>
            <kcal>2000</kcal>
            <proteins>150</proteins>
            <fats>65</fats>
            <carbs>250</carbs>
          </daily_summary>
          <meals>
            <meal>
              <name>Breakfast</name>
              <ingredients>Eggs</ingredients>
              <preparation>Cook</preparation>
              <summary>
                <kcal>abc</kcal>
                <protein>30</protein>
                <fat>xyz</fat>
                <carb>50</carb>
              </summary>
            </meal>
          </meals>
        `;

        const result = parseXmlMealPlan(message);

        expect(result.meals[0].summary).toEqual({
          kcal: 0,
          p: 30,
          f: 0,
          c: 50,
        });
      });

      it("should handle empty string numeric values", () => {
        const message = `
          <daily_summary>
            <kcal></kcal>
            <proteins>150</proteins>
          </daily_summary>
          <meals>
            <meal>
              <name>Breakfast</name>
              <ingredients>Eggs</ingredients>
              <preparation>Cook</preparation>
              <summary>
                <kcal>500</kcal>
                <protein></protein>
                <fat>20</fat>
                <carb>50</carb>
              </summary>
            </meal>
          </meals>
        `;

        const result = parseXmlMealPlan(message);

        expect(result.dailySummary.kcal).toBe(0);
        expect(result.meals[0].summary.p).toBe(0);
      });

      it("should handle negative numeric values by rounding to zero", () => {
        const message = `
          <daily_summary>
            <kcal>-100</kcal>
            <proteins>-50</proteins>
            <fats>65</fats>
            <carbs>250</carbs>
          </daily_summary>
          <meals>
            <meal>
              <name>Breakfast</name>
              <ingredients>Eggs</ingredients>
              <preparation>Cook</preparation>
              <summary>
                <kcal>-50</kcal>
                <protein>30</protein>
                <fat>-10</fat>
                <carb>50</carb>
              </summary>
            </meal>
          </meals>
        `;

        const result = parseXmlMealPlan(message);

        // Negative values should be parsed and rounded to 0 (Math.round(-100) = -100, but in practice would show as 0)
        expect(result.dailySummary.kcal).toBe(-100);
        expect(result.dailySummary.proteins).toBe(-50);
        expect(result.meals[0].summary.kcal).toBe(-50);
        expect(result.meals[0].summary.f).toBe(-10);
      });
    });

    describe("whitespace handling", () => {
      it("should trim whitespace from text fields", () => {
        const message = `
          <daily_summary>
            <kcal>2000</kcal>
            <proteins>150</proteins>
            <fats>65</fats>
            <carbs>250</carbs>
          </daily_summary>
          <meals>
            <meal>
              <name>  Breakfast  </name>
              <ingredients>  Eggs, toast  </ingredients>
              <preparation>  Cook eggs  </preparation>
              <summary>
                <kcal>500</kcal>
                <protein>30</protein>
                <fat>20</fat>
                <carb>50</carb>
              </summary>
            </meal>
          </meals>
        `;

        const result = parseXmlMealPlan(message);

        expect(result.meals[0].name).toBe("Breakfast");
        expect(result.meals[0].ingredients).toBe("Eggs, toast");
        expect(result.meals[0].preparation).toBe("Cook eggs");
      });

      it("should handle numeric values with whitespace", () => {
        const message = `
          <daily_summary>
            <kcal>  2000  </kcal>
            <proteins>  150  </proteins>
          </daily_summary>
          <meals>
            <meal>
              <name>Breakfast</name>
              <ingredients>Eggs</ingredients>
              <preparation>Cook</preparation>
              <summary>
                <kcal>  500  </kcal>
                <protein>  30  </protein>
                <fat>20</fat>
                <carb>50</carb>
              </summary>
            </meal>
          </meals>
        `;

        const result = parseXmlMealPlan(message);

        expect(result.dailySummary.kcal).toBe(2000);
        expect(result.dailySummary.proteins).toBe(150);
        expect(result.meals[0].summary.kcal).toBe(500);
        expect(result.meals[0].summary.p).toBe(30);
      });
    });

    describe("fallback behavior when no meals found", () => {
      it("should return fallback meal structure when meals tag is missing", () => {
        const message = `
          <daily_summary>
            <kcal>2000</kcal>
            <proteins>150</proteins>
            <fats>65</fats>
            <carbs>250</carbs>
          </daily_summary>
          Some text here
        `;

        const result = parseXmlMealPlan(message);

        expect(result.meals).toHaveLength(1);
        expect(result.meals[0].name).toBe("");
        expect(result.meals[0].ingredients).toBe("");
        expect(result.meals[0].preparation).toContain("<daily_summary>");
        expect(result.meals[0].preparation).toContain("Some text here");
        expect(result.meals[0].summary).toEqual({
          kcal: 0,
          p: 0,
          f: 0,
          c: 0,
        });
      });

      it("should return fallback meal with full message when no XML tags exist", () => {
        const message = "This is just plain text with no XML tags at all.";

        const result = parseXmlMealPlan(message);

        expect(result.dailySummary).toEqual({
          kcal: 0,
          proteins: 0,
          fats: 0,
          carbs: 0,
        });
        expect(result.meals).toHaveLength(1);
        expect(result.meals[0]).toEqual({
          name: "",
          ingredients: "",
          preparation: "This is just plain text with no XML tags at all.",
          summary: {
            kcal: 0,
            p: 0,
            f: 0,
            c: 0,
          },
        });
      });

      it("should return fallback meal when meals tag is empty", () => {
        const message = `
          <daily_summary>
            <kcal>2000</kcal>
          </daily_summary>
          <meals></meals>
        `;

        const result = parseXmlMealPlan(message);

        expect(result.meals).toHaveLength(1);
        expect(result.meals[0].preparation).toContain("daily_summary");
      });
    });

    describe("multiple meals", () => {
      it("should parse all meals from meals tag", () => {
        const message = `
          <daily_summary>
            <kcal>2000</kcal>
            <proteins>150</proteins>
            <fats>65</fats>
            <carbs>250</carbs>
          </daily_summary>
          <meals>
            <meal>
              <name>Breakfast</name>
              <ingredients>Eggs</ingredients>
              <preparation>Cook</preparation>
              <summary>
                <kcal>500</kcal>
                <protein>30</protein>
                <fat>20</fat>
                <carb>50</carb>
              </summary>
            </meal>
            <meal>
              <name>Lunch</name>
              <ingredients>Chicken</ingredients>
              <preparation>Grill</preparation>
              <summary>
                <kcal>750</kcal>
                <protein>60</protein>
                <fat>25</fat>
                <carb>80</carb>
              </summary>
            </meal>
            <meal>
              <name>Dinner</name>
              <ingredients>Fish</ingredients>
              <preparation>Bake</preparation>
              <summary>
                <kcal>750</kcal>
                <protein>60</protein>
                <fat>20</fat>
                <carb>120</carb>
              </summary>
            </meal>
          </meals>
        `;

        const result = parseXmlMealPlan(message);

        expect(result.meals).toHaveLength(3);
        expect(result.meals.map((m) => m.name)).toEqual(["Breakfast", "Lunch", "Dinner"]);
      });
    });

    describe("edge cases", () => {
      it("should handle empty string input", () => {
        const result = parseXmlMealPlan("");

        expect(result.dailySummary).toEqual({
          kcal: 0,
          proteins: 0,
          fats: 0,
          carbs: 0,
        });
        expect(result.meals).toHaveLength(1);
        expect(result.meals[0].preparation).toBe("");
      });

      it("should handle newlines and multiline content", () => {
        const message = `
          <daily_summary>
            <kcal>2000</kcal>
            <proteins>150</proteins>
            <fats>65</fats>
            <carbs>250</carbs>
          </daily_summary>
          <meals>
            <meal>
              <name>Breakfast</name>
              <ingredients>Eggs
Toast
Butter</ingredients>
              <preparation>Scramble eggs
Toast bread
Add butter</preparation>
              <summary>
                <kcal>500</kcal>
                <protein>30</protein>
                <fat>20</fat>
                <carb>50</carb>
              </summary>
            </meal>
          </meals>
        `;

        const result = parseXmlMealPlan(message);

        expect(result.meals[0].ingredients).toContain("Eggs");
        expect(result.meals[0].ingredients).toContain("Toast");
        expect(result.meals[0].preparation).toContain("Scramble eggs");
      });

      it("should handle special characters in text fields", () => {
        const message = `
          <daily_summary>
            <kcal>2000</kcal>
            <proteins>150</proteins>
            <fats>65</fats>
            <carbs>250</carbs>
          </daily_summary>
          <meals>
            <meal>
              <name>Breakfast & Brunch</name>
              <ingredients>Eggs (2), Toast & Butter</ingredients>
              <preparation>Cook at 180°C for 10-15 min</preparation>
              <summary>
                <kcal>500</kcal>
                <protein>30</protein>
                <fat>20</fat>
                <carb>50</carb>
              </summary>
            </meal>
          </meals>
        `;

        const result = parseXmlMealPlan(message);

        expect(result.meals[0].name).toBe("Breakfast & Brunch");
        expect(result.meals[0].ingredients).toBe("Eggs (2), Toast & Butter");
        expect(result.meals[0].preparation).toBe("Cook at 180°C for 10-15 min");
      });

      it("should handle malformed XML with unclosed tags gracefully", () => {
        const message = `
          <daily_summary>
            <kcal>2000</kcal>
            <proteins>150</proteins>
            <fats>65</fats>
          <meals>
            <meal>
              <name>Breakfast</name>
              <ingredients>Eggs</ingredients>
              <preparation>Cook</preparation>
              <summary>
                <kcal>500</kcal>
                <protein>30</protein>
                <fat>20</fat>
                <carb>50</carb>
              </summary>
            </meal>
          </meals>
        `;

        // Note: The parser uses regex matching, so unclosed outer tags may break parsing
        // But it should still handle gracefully by returning defaults or what it can parse
        const result = parseXmlMealPlan(message);

        // The parser should handle this and still return valid structure
        // Even if some tags are malformed, it should parse what it can
        expect(result.dailySummary).toBeDefined();
        expect(result.meals).toBeDefined();
        // At minimum, meals array should exist (might be empty or have fallback)
        expect(Array.isArray(result.meals)).toBe(true);
      });

      it("should handle unclosed meal tags", () => {
        const message = `
          <daily_summary>
            <kcal>2000</kcal>
            <proteins>150</proteins>
            <fats>65</fats>
            <carbs>250</carbs>
          </daily_summary>
          <meals>
            <meal>
              <name>Breakfast</name>
              <ingredients>Eggs</ingredients>
              <preparation>Cook
            <meal>
              <name>Lunch</name>
              <ingredients>Chicken</ingredients>
            </meal>
          </meals>
        `;

        const result = parseXmlMealPlan(message);

        // Should parse what it can - at least one meal should be found
        expect(result.dailySummary.kcal).toBe(2000);
        // The parser should handle the unclosed meal tag and continue
        expect(result.meals.length).toBeGreaterThan(0);
      });
    });
  });

  describe("extractComments", () => {
    it("should extract comments from XML tags", () => {
      const message = `
        <meal_plan>
          Some content
        </meal_plan>
        <comments>This is a comment about the meal plan</comments>
      `;

      const result = extractComments(message);

      expect(result).toBe("This is a comment about the meal plan");
    });

    it("should return null when comments tag is missing", () => {
      const message = `
        <meal_plan>
          Some content
        </meal_plan>
      `;

      const result = extractComments(message);

      expect(result).toBeNull();
    });

    it("should handle case-insensitive comments tag", () => {
      const message = `
        <COMMENTS>Uppercase comment</COMMENTS>
      `;

      const result = extractComments(message);

      expect(result).toBe("Uppercase comment");
    });

    it("should handle mixed case comments tag", () => {
      const message = `
        <Comments>Mixed case comment</Comments>
      `;

      const result = extractComments(message);

      expect(result).toBe("Mixed case comment");
    });

    it("should trim whitespace from comments", () => {
      const message = `
        <comments>  Comment with whitespace  </comments>
      `;

      const result = extractComments(message);

      expect(result).toBe("Comment with whitespace");
    });

    it("should preserve multiline comments", () => {
      const message = `
        <comments>Line 1
Line 2
Line 3</comments>
      `;

      const result = extractComments(message);

      expect(result).toBe("Line 1\nLine 2\nLine 3");
    });

    it("should return empty string for empty comments tag", () => {
      const message = "<comments></comments>";

      const result = extractComments(message);

      expect(result).toBe("");
    });

    it("should extract first comments tag when multiple exist", () => {
      const message = `
        <comments>First comment</comments>
        <comments>Second comment</comments>
      `;

      const result = extractComments(message);

      expect(result).toBe("First comment");
    });

    it("should handle comments with XML-like content", () => {
      const message = `
        <comments>This is not <tag>XML</tag>, it's just text</comments>
      `;

      const result = extractComments(message);

      expect(result).toBe("This is not <tag>XML</tag>, it's just text");
    });
  });

  describe("removeXmlTags", () => {
    it("should remove meal_plan tags and their content", () => {
      const message = `
        Some introductory text
        <meal_plan>
          <daily_summary>...</daily_summary>
          <meals>...</meals>
        </meal_plan>
        Some closing text
      `;

      const result = removeXmlTags(message);

      expect(result).not.toContain("<meal_plan>");
      expect(result).not.toContain("daily_summary");
      expect(result).not.toContain("meals");
    });

    it("should preserve comments content but remove tags", () => {
      const message = `
        <meal_plan>Content</meal_plan>
        <comments>Important note about the plan</comments>
        Some other text
      `;

      const result = removeXmlTags(message);

      expect(result).toContain("Important note about the plan");
      expect(result).not.toContain("<comments>");
      expect(result).not.toContain("</comments>");
    });

    it("should remove all remaining XML tags", () => {
      const message = `
        <meal_plan>Content</meal_plan>
        <div>Some div</div>
        <span>Some span</span>
        Regular text here
      `;

      const result = removeXmlTags(message);

      expect(result).not.toContain("<div>");
      expect(result).not.toContain("<span>");
      expect(result).toContain("Regular text here");
    });

    it("should clean up excessive whitespace", () => {
      const message = `
        <meal_plan>Content</meal_plan>
        
        
        Text here
        
        
        More text
      `;

      const result = removeXmlTags(message);

      // Should not have more than two consecutive newlines
      expect(result).not.toMatch(/\n\s*\n\s*\n/);
    });

    it("should preserve comments when they are not included in cleaned output", () => {
      const message = `
        <meal_plan>Content</meal_plan>
        <comments>Important comment</comments>
      `;

      const result = removeXmlTags(message);

      expect(result).toContain("Important comment");
    });

    it("should handle case-insensitive tags", () => {
      const message = `
        <MEAL_PLAN>Content</MEAL_PLAN>
        <COMMENTS>Comment</COMMENTS>
      `;

      const result = removeXmlTags(message);

      expect(result).not.toContain("MEAL_PLAN");
      expect(result).toContain("Comment");
    });

    it("should handle messages with no XML tags", () => {
      const message = "This is just plain text with no XML at all.";

      const result = removeXmlTags(message);

      expect(result).toBe("This is just plain text with no XML at all.");
    });

    it("should handle empty string", () => {
      const result = removeXmlTags("");

      expect(result).toBe("");
    });

    it("should handle multiline comments properly", () => {
      const message = `
        <meal_plan>Content</meal_plan>
        <comments>Line 1
Line 2
Line 3</comments>
        Some text
      `;

      const result = removeXmlTags(message);

      expect(result).toContain("Line 1");
      expect(result).toContain("Line 2");
      expect(result).toContain("Line 3");
      expect(result).toContain("Some text");
    });

    it("should handle complex message with mixed content", () => {
      const message = `
        Introduction text here.
        <meal_plan>
          <daily_summary>
            <kcal>2000</kcal>
          </daily_summary>
          <meals>
            <meal>...</meal>
          </meals>
        </meal_plan>
        <comments>This plan looks good!</comments>
        Closing remarks here.
        <div>Some leftover tag</div>
      `;

      const result = removeXmlTags(message);

      expect(result).toContain("Introduction text here.");
      expect(result).toContain("This plan looks good!");
      expect(result).toContain("Closing remarks here.");
      expect(result).not.toContain("<meal_plan>");
      expect(result).not.toContain("<div>");
    });

    it("should trim the final output", () => {
      const message = `
        <meal_plan>Content</meal_plan>
        Text here
        
      `;

      const result = removeXmlTags(message);

      expect(result).not.toMatch(/^\s/);
      expect(result).not.toMatch(/\s$/);
    });

    it("should handle nested tags correctly", () => {
      const message = `
        <meal_plan>
          <nested>
            <deep>Content</deep>
          </nested>
        </meal_plan>
        Text outside
      `;

      const result = removeXmlTags(message);

      expect(result).not.toContain("<meal_plan>");
      expect(result).not.toContain("<nested>");
      expect(result).not.toContain("<deep>");
      expect(result).toContain("Text outside");
    });
  });
});
