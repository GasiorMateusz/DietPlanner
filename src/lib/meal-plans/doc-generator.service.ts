import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  WidthType,
  Table,
  TableRow,
  TableCell,
} from "docx";
import type { TypedMealPlanRow, MealPlanMeal } from "../../types.ts";

/**
 * Service for generating meal plan documents in Microsoft Word format.
 */
export class DocumentGeneratorService {
  /**
   * Generates a .doc file from meal plan data.
   * @param mealPlan - The complete meal plan row from database
   * @returns Buffer containing the .doc file data
   */
  static async generateDoc(mealPlan: TypedMealPlanRow): Promise<Buffer> {
    const children = this.generateDocumentChildren(mealPlan);
    const doc = new Document({
      sections: [
        {
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return buffer as Buffer;
  }

  /**
   * Generates all document children (paragraphs and tables) from meal plan data.
   */
  private static generateDocumentChildren(mealPlan: TypedMealPlanRow): (Paragraph | Table)[] {
    const children: (Paragraph | Table)[] = [];

    // Title
    children.push(
      new Paragraph({
        text: mealPlan.name,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Startup Data Section
    children.push(...this.formatStartupData(mealPlan));

    // Daily Summary Section
    children.push(...this.formatDailySummary(mealPlan));

    // Meals Section
    children.push(...this.formatMeals(mealPlan.plan_content.meals));

    return children;
  }

  /**
   * Formats the startup data section.
   */
  private static formatStartupData(mealPlan: TypedMealPlanRow): (Paragraph | Table)[] {
    const paragraphs: (Paragraph | Table)[] = [];

    paragraphs.push(
      new Paragraph({
        text: "Patient Information",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    const data = [
      { label: "Age:", value: mealPlan.patient_age?.toString() ?? "Not specified" },
      { label: "Weight:", value: mealPlan.patient_weight ? `${mealPlan.patient_weight} kg` : "Not specified" },
      { label: "Height:", value: mealPlan.patient_height ? `${mealPlan.patient_height} cm` : "Not specified" },
      {
        label: "Activity Level:",
        value: mealPlan.activity_level
          ? mealPlan.activity_level.charAt(0).toUpperCase() + mealPlan.activity_level.slice(1)
          : "Not specified",
      },
      { label: "Target Calories:", value: mealPlan.target_kcal?.toString() ?? "Not specified" },
    ];

    // Macro distribution
    if (mealPlan.target_macro_distribution) {
      const macro = mealPlan.target_macro_distribution;
      data.push({
        label: "Target Macro Distribution:",
        value: `P: ${macro.p_perc}%, F: ${macro.f_perc}%, C: ${macro.c_perc}%`,
      });
    }

    // Create table for startup data
    const rows = data.map(
      (item) =>
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: item.label, bold: true })],
                }),
              ],
              width: { size: 35, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ text: item.value })],
              width: { size: 65, type: WidthType.PERCENTAGE },
            }),
          ],
        })
    );

    paragraphs.push(
      new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [],
        margins: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
      })
    );

    // Meal names
    if (mealPlan.meal_names) {
      paragraphs.push(
        new Paragraph({
          text: "Meal Names:",
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 300, after: 100 },
        })
      );
      paragraphs.push(new Paragraph({ text: mealPlan.meal_names }));
    }

    // Exclusions and guidelines
    if (mealPlan.exclusions_guidelines) {
      paragraphs.push(
        new Paragraph({
          text: "Exclusions & Guidelines:",
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 300, after: 100 },
        })
      );
      paragraphs.push(new Paragraph({ text: mealPlan.exclusions_guidelines }));
    }

    return paragraphs;
  }

  /**
   * Formats the daily summary section.
   */
  private static formatDailySummary(mealPlan: TypedMealPlanRow): (Paragraph | Table)[] {
    const paragraphs: (Paragraph | Table)[] = [];
    const summary = mealPlan.plan_content.daily_summary;

    paragraphs.push(
      new Paragraph({
        text: "Daily Nutritional Summary",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    // Create summary table
    const rows = [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Total Kcal", bold: true })] })],
            width: { size: 25, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Proteins", bold: true })] })],
            width: { size: 25, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Fats", bold: true })] })],
            width: { size: 25, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Carbs", bold: true })] })],
            width: { size: 25, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: summary.kcal.toString() })],
          }),
          new TableCell({
            children: [new Paragraph({ text: `${summary.proteins}g` })],
          }),
          new TableCell({
            children: [new Paragraph({ text: `${summary.fats}g` })],
          }),
          new TableCell({
            children: [new Paragraph({ text: `${summary.carbs}g` })],
          }),
        ],
      }),
    ];

    paragraphs.push(
      new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [],
        margins: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
      })
    );

    return paragraphs;
  }

  /**
   * Formats the meals section.
   */
  private static formatMeals(meals: MealPlanMeal[]): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    paragraphs.push(
      new Paragraph({
        text: "Meals",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 300 },
      })
    );

    meals.forEach((meal, index) => {
      const mealNumber = index + 1;

      // Meal heading
      paragraphs.push(
        new Paragraph({
          text: `Meal ${mealNumber}: ${meal.name}`,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: mealNumber === 1 ? 0 : 300, after: 100 },
        })
      );

      // Ingredients
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: "Ingredients: ", bold: true }), new TextRun({ text: meal.ingredients })],
          spacing: { after: 200 },
        })
      );

      // Preparation
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: "Preparation: ", bold: true }), new TextRun({ text: meal.preparation })],
          spacing: { after: 200 },
        })
      );

      // Nutrition summary
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Nutrition: ", bold: true }),
            new TextRun({
              text: `${meal.summary.kcal} kcal | P: ${meal.summary.p}g | F: ${meal.summary.f}g | C: ${meal.summary.c}g`,
            }),
          ],
          spacing: { after: 300 },
        })
      );
    });

    return paragraphs;
  }

  /**
   * Sanitizes filename for safe file system usage.
   * Removes special characters, limits length, and replaces spaces with hyphens.
   * @param name - The meal plan name
   * @returns Sanitized filename
   */
  static sanitizeFilename(name: string): string {
    // Remove special characters except spaces, hyphens, and underscores
    let sanitized = name.replace(/[^a-zA-Z0-9\s\-_]/g, "");

    // Replace spaces with hyphens
    sanitized = sanitized.replace(/\s+/g, "-");

    // Limit length to 100 characters
    sanitized = sanitized.substring(0, 100);

    // Remove consecutive hyphens
    sanitized = sanitized.replace(/-+/g, "-");

    // Remove leading/trailing hyphens
    sanitized = sanitized.replace(/^-+|-+$/g, "");

    // Fallback to default if sanitized name is empty
    if (!sanitized) {
      sanitized = "meal-plan";
    }

    return sanitized;
  }
}
