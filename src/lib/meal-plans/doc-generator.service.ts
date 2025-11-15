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
import type {
  TypedMealPlanRow,
  MealPlanMeal,
  ExportContentOptions,
  GetMultiDayPlanByIdResponseDto,
} from "../../types.ts";
import type { LanguageCode } from "../i18n/types.ts";
import { getExportTranslations } from "../i18n/export-translations.ts";

/**
 * Generates all document children (paragraphs and tables) from meal plan data.
 * @param mealPlan - The complete meal plan row from database
 * @param options - Export content options
 * @param language - Language code for translations
 */
function generateDocumentChildren(
  mealPlan: TypedMealPlanRow,
  options: ExportContentOptions,
  language: LanguageCode
): (Paragraph | Table)[] {
  const t = getExportTranslations(language);
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
  children.push(...formatStartupData(mealPlan));

  // Daily Summary Section (if enabled)
  if (options.dailySummary) {
    children.push(...formatDailySummary(mealPlan, t));
  }

  // Meals Section
  children.push(...formatMeals(mealPlan.plan_content.meals, options, t));

  return children;
}

/**
 * Generates a .doc file from meal plan data with specified options.
 * @param mealPlan - The complete meal plan row from database
 * @param options - Export content options
 * @param language - Language code for translations (default: "en")
 * @returns Buffer containing the .doc file data
 */
export async function generateDoc(
  mealPlan: TypedMealPlanRow,
  options: ExportContentOptions,
  language: LanguageCode = "en"
): Promise<Buffer> {
  const children = generateDocumentChildren(mealPlan, options, language);
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
 * Formats the startup data section.
 * @param mealPlan - The complete meal plan row from database
 */
function formatStartupData(mealPlan: TypedMealPlanRow): (Paragraph | Table)[] {
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
 * @param mealPlan - The complete meal plan row from database
 * @param t - Translation function
 */
function formatDailySummary(
  mealPlan: TypedMealPlanRow,
  t: ReturnType<typeof getExportTranslations>
): (Paragraph | Table)[] {
  const paragraphs: (Paragraph | Table)[] = [];
  const summary = mealPlan.plan_content.daily_summary;

  paragraphs.push(
    new Paragraph({
      text: t["summary.dailySummary"],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
    })
  );

  // Create summary table
  const rows = [
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: t["summary.totalKcal"], bold: true })] })],
          width: { size: 25, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: t["summary.proteins"], bold: true })] })],
          width: { size: 25, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: t["summary.fats"], bold: true })] })],
          width: { size: 25, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: t["summary.carbs"], bold: true })] })],
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
 * @param meals - Array of meals
 * @param options - Export content options
 * @param t - Translation function
 */
function formatMeals(
  meals: MealPlanMeal[],
  options: ExportContentOptions,
  t: ReturnType<typeof getExportTranslations>
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    new Paragraph({
      text: t["editor.meals"],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 300 },
    })
  );

  meals.forEach((meal, index) => {
    const mealNumber = index + 1;

    // Meal heading
    paragraphs.push(
      new Paragraph({
        text: `${t["editor.meal"]} ${mealNumber}: ${meal.name}`,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: mealNumber === 1 ? 0 : 300, after: 100 },
      })
    );

    // Meals Summary (if enabled)
    if (options.mealsSummary) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${t["editor.mealSummary"]}: `, bold: true }),
            new TextRun({
              text: `${meal.summary.kcal} ${t["summary.kcal"]} | ${t["summary.proteins"]}: ${meal.summary.p}g | ${t["summary.fats"]}: ${meal.summary.f}g | ${t["summary.carbs"]}: ${meal.summary.c}g`,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    // Ingredients (if enabled)
    if (options.ingredients) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${t["editor.ingredients"]}: `, bold: true }),
            new TextRun({ text: meal.ingredients }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    // Preparation (if enabled)
    if (options.preparation) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${t["editor.preparation"]}: `, bold: true }),
            new TextRun({ text: meal.preparation }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    // Add spacing after meal if not the last one
    if (index < meals.length - 1) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 300 },
        })
      );
    }
  });

  return paragraphs;
}

export async function generateMultiDayDoc(
  multiDayPlan: GetMultiDayPlanByIdResponseDto,
  options: ExportContentOptions,
  language: LanguageCode = "en"
): Promise<Buffer> {
  const t = getExportTranslations(language);
  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({
      text: multiDayPlan.name,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  children.push(
    new Paragraph({
      text:
        language === "pl"
          ? `Liczba dni: ${multiDayPlan.number_of_days}`
          : `Number of Days: ${multiDayPlan.number_of_days}`,
      spacing: { after: 200 },
    })
  );

  if (multiDayPlan.common_exclusions_guidelines) {
    children.push(
      new Paragraph({
        text: language === "pl" ? "Wspólne wytyczne" : "Common Guidelines",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
      })
    );
    children.push(
      new Paragraph({
        text: multiDayPlan.common_exclusions_guidelines,
        spacing: { after: 300 },
      })
    );
  }

  const sortedDays = [...multiDayPlan.days].sort((a, b) => a.day_number - b.day_number);

  for (const day of sortedDays) {
    children.push(
      new Paragraph({
        text: `${language === "pl" ? "Dzień" : "Day"} ${day.day_number}${day.day_plan.name ? `: ${day.day_plan.name}` : ""}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    if (options.dailySummary) {
      children.push(...formatDailySummary(day.day_plan, t));
    }

    children.push(...formatMeals(day.day_plan.plan_content.meals, options, t));
  }

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
 * Sanitizes filename for safe file system usage.
 * Removes special characters, limits length, and replaces spaces with hyphens.
 * @param name - The meal plan name
 * @returns Sanitized filename
 */
export function sanitizeFilename(name: string): string {
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
