import type { LanguageCode } from "./types";
import enTranslations from "./translations/en.json";
import plTranslations from "./translations/pl.json";

/**
 * Translation keys used in export documents.
 */
type ExportTranslationKey =
  | "summary.dailySummary"
  | "summary.totalKcal"
  | "summary.kcal"
  | "summary.proteins"
  | "summary.fats"
  | "summary.carbs"
  | "editor.meals"
  | "editor.mealSummary"
  | "editor.ingredients"
  | "editor.preparation"
  | "editor.meal"
  | "export.collapse"
  | "export.expand";

/**
 * Translation mappings for export documents.
 */
const translations: Record<LanguageCode, Record<ExportTranslationKey, string>> = {
  en: {
    "summary.dailySummary": enTranslations["summary.dailySummary"],
    "summary.totalKcal": enTranslations["summary.totalKcal"],
    "summary.kcal": enTranslations["summary.kcal"],
    "summary.proteins": enTranslations["summary.proteins"],
    "summary.fats": enTranslations["summary.fats"],
    "summary.carbs": enTranslations["summary.carbs"],
    "editor.meals": enTranslations["editor.meals"],
    "editor.mealSummary": enTranslations["editor.mealSummary"],
    "editor.ingredients": enTranslations["editor.ingredients"],
    "editor.preparation": enTranslations["editor.preparation"],
    "editor.meal": enTranslations["editor.meal"],
    "export.collapse": enTranslations["export.collapse"],
    "export.expand": enTranslations["export.expand"],
  },
  pl: {
    "summary.dailySummary": plTranslations["summary.dailySummary"],
    "summary.totalKcal": plTranslations["summary.totalKcal"],
    "summary.kcal": plTranslations["summary.kcal"],
    "summary.proteins": plTranslations["summary.proteins"],
    "summary.fats": plTranslations["summary.fats"],
    "summary.carbs": plTranslations["summary.carbs"],
    "editor.meals": plTranslations["editor.meals"],
    "editor.mealSummary": plTranslations["editor.mealSummary"],
    "editor.ingredients": plTranslations["editor.ingredients"],
    "editor.preparation": plTranslations["editor.preparation"],
    "editor.meal": plTranslations["editor.meal"],
    "export.collapse": plTranslations["export.collapse"],
    "export.expand": plTranslations["export.expand"],
  },
};

/**
 * Gets a translation for export documents.
 * @param key - Translation key
 * @param language - Language code
 * @returns Translated string
 */
export function getExportTranslation(key: ExportTranslationKey, language: LanguageCode): string {
  return translations[language][key];
}

/**
 * Gets all export translations for a given language.
 * @param language - Language code
 * @returns Object with all export translations
 */
export function getExportTranslations(language: LanguageCode): Record<ExportTranslationKey, string> {
  return translations[language];
}
