import type { TypedMealPlanRow, MealPlanMeal, MealPlanContentDailySummary, ExportContentOptions } from "../../types.ts";
import type { LanguageCode } from "../i18n/types.ts";
import { sanitizeFilename as sanitizeFilenameFromDoc } from "./doc-generator.service";
import { getExportTranslations } from "../i18n/export-translations.ts";

/**
 * HTML Generator Service for creating interactive HTML exports of meal plans.
 * Generates standalone HTML files with embedded CSS and JavaScript for expand/collapse functionality.
 */
export class HtmlGeneratorService {
  /**
   * Generates an HTML file from meal plan data with specified options.
   * @param mealPlan - The complete meal plan row from database
   * @param options - Export content options
   * @param language - Language code for translations (default: "en")
   * @returns HTML string
   */
  generateHtml(mealPlan: TypedMealPlanRow, options: ExportContentOptions, language: LanguageCode = "en"): string {
    return this.generateDocument(mealPlan, options, language);
  }

  /**
   * Generates HTML document structure with expand/collapse sections.
   * @param mealPlan - The complete meal plan row from database
   * @param options - Export content options
   * @param language - Language code for translations
   * @returns Complete HTML document string
   */
  private generateDocument(mealPlan: TypedMealPlanRow, options: ExportContentOptions, language: LanguageCode): string {
    const t = getExportTranslations(language);
    const sections: string[] = [];

    // Validate plan_content exists
    if (!mealPlan.plan_content) {
      throw new Error("Meal plan content is missing");
    }

    // Daily Summary Section (if enabled)
    if (options.dailySummary) {
      if (!mealPlan.plan_content.daily_summary) {
        throw new Error("Daily summary is missing from meal plan content");
      }
      sections.push(this.generateDailySummarySection(mealPlan.plan_content.daily_summary, t));
    }

    // Meals Section (if any meal content is enabled)
    if (options.mealsSummary || options.ingredients || options.preparation) {
      // Ensure meals array exists and is valid
      const meals = mealPlan.plan_content?.meals ?? [];
      sections.push(this.generateMealsSection(meals, options, t));
    }

    // Ensure we have at least the title (validation should prevent this, but defensive coding)
    const sectionsHtml = sections.length > 0 ? sections.join("\n    ") : "<p>No content available.</p>";

    const html = `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(mealPlan.name ?? "Meal Plan")}</title>
  <style>
    ${this.getStyles()}
  </style>
</head>
<body>
  <div class="container">
    <h1 class="title">${this.escapeHtml(mealPlan.name ?? "Meal Plan")}</h1>
    ${sectionsHtml}
  </div>
  <script>
    ${this.getScript(t)}
  </script>
</body>
</html>`;

    return html;
  }

  /**
   * Generates daily summary section (if enabled).
   * @param summary - Daily summary data
   * @param t - Translation function
   * @returns HTML string for daily summary section
   */
  private generateDailySummarySection(
    summary: MealPlanContentDailySummary,
    t: ReturnType<typeof getExportTranslations>
  ): string {
    return `
    <section class="daily-summary-section" data-collapsible>
      <div class="section-header">
        <h2>${t["summary.dailySummary"]}</h2>
        <button class="toggle-button" aria-expanded="true" aria-controls="daily-summary-content">
          <span class="toggle-text">${t["export.collapse"]}</span>
          <span class="toggle-icon">▼</span>
        </button>
      </div>
      <div class="section-content" id="daily-summary-content">
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">${t["summary.totalKcal"]}</div>
            <div class="summary-value">${summary.kcal}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">${t["summary.proteins"]}</div>
            <div class="summary-value">${summary.proteins}g</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">${t["summary.fats"]}</div>
            <div class="summary-value">${summary.fats}g</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">${t["summary.carbs"]}</div>
            <div class="summary-value">${summary.carbs}g</div>
          </div>
        </div>
      </div>
    </section>`;
  }

  /**
   * Generates meals section with expand/collapse functionality.
   * @param meals - Array of meals
   * @param options - Export content options
   * @param t - Translation function
   * @returns HTML string for meals section
   */
  private generateMealsSection(
    meals: MealPlanMeal[],
    options: ExportContentOptions,
    t: ReturnType<typeof getExportTranslations>
  ): string {
    // Handle empty meals array
    if (!meals || meals.length === 0) {
      return `
    <section class="meals-section">
      <h2>${t["editor.meals"]}</h2>
      <p>No meals available.</p>
    </section>`;
    }

    // Filter out null/undefined meals and generate sections
    const validMeals = meals.filter((meal): meal is MealPlanMeal => meal != null);
    if (validMeals.length === 0) {
      return `
    <section class="meals-section">
      <h2>${t["editor.meals"]}</h2>
      <p>No meals available.</p>
    </section>`;
    }
    const mealsHtml = validMeals.map((meal, index) => this.generateMealSection(meal, index, options, t)).join("\n");

    return `
    <section class="meals-section">
      <h2>${t["editor.meals"]}</h2>
      ${mealsHtml}
    </section>`;
  }

  /**
   * Generates a single meal section.
   * @param meal - Meal data
   * @param index - Meal index (0-based)
   * @param options - Export content options
   * @param t - Translation function
   * @returns HTML string for single meal
   */
  private generateMealSection(
    meal: MealPlanMeal,
    index: number,
    options: ExportContentOptions,
    t: ReturnType<typeof getExportTranslations>
  ): string {
    if (!meal) {
      return "";
    }

    const mealNumber = index + 1;
    const mealId = `meal-${mealNumber}`;
    const hasContent = options.mealsSummary || options.ingredients || options.preparation;
    const collapsibleClass = hasContent ? "data-collapsible" : "";

    const contentParts: string[] = [];

    // Meals Summary (if enabled)
    if (options.mealsSummary) {
      // Validate summary exists
      if (!meal.summary) {
        throw new Error(`Meal ${mealNumber} is missing summary data`);
      }
      contentParts.push(`
          <div class="meal-summary">
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">${t["summary.kcal"]}</div>
                <div class="summary-value">${meal.summary.kcal ?? 0}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">${t["summary.proteins"]}</div>
                <div class="summary-value">${meal.summary.p ?? 0}g</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">${t["summary.fats"]}</div>
                <div class="summary-value">${meal.summary.f ?? 0}g</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">${t["summary.carbs"]}</div>
                <div class="summary-value">${meal.summary.c ?? 0}g</div>
              </div>
            </div>
          </div>`);
    }

    // Ingredients (if enabled)
    if (options.ingredients) {
      const ingredientsText = meal.ingredients ?? "";
      contentParts.push(`
          <div class="meal-detail">
            <h4>${t["editor.ingredients"]}</h4>
            <p>${this.escapeHtml(ingredientsText).replace(/\n/g, "<br>")}</p>
          </div>`);
    }

    // Preparation (if enabled)
    if (options.preparation) {
      const preparationText = meal.preparation ?? "";
      contentParts.push(`
          <div class="meal-detail">
            <h4>${t["editor.preparation"]}</h4>
            <p>${this.escapeHtml(preparationText).replace(/\n/g, "<br>")}</p>
          </div>`);
    }

    const toggleButton = hasContent
      ? `
        <button class="toggle-button" aria-expanded="true" aria-controls="${mealId}-content">
          <span class="toggle-text">${t["export.collapse"]}</span>
          <span class="toggle-icon">▼</span>
        </button>`
      : "";

    const mealName = meal.name ?? "";
    return `
      <div class="meal-item" ${collapsibleClass}>
        <div class="meal-header">
          <h3>${t["editor.meal"]} ${mealNumber}: ${this.escapeHtml(mealName)}</h3>
          ${toggleButton}
        </div>
        ${hasContent ? `<div class="meal-content" id="${mealId}-content">${contentParts.join("")}</div>` : ""}
      </div>`;
  }

  /**
   * Escapes HTML special characters to prevent XSS.
   * @param text - Text to escape
   * @returns Escaped HTML string
   */
  private escapeHtml(text: string | null | undefined): string {
    if (text == null) {
      return "";
    }
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Returns embedded CSS styles for the HTML document.
   * Matches editor template styling as closely as possible.
   */
  private getStyles(): string {
    return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background-color: #ffffff;
      padding: 2rem;
    }

    @media (prefers-color-scheme: dark) {
      body {
        color: #e5e5e5;
        background-color: #0a0a0a;
      }
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .title {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 2rem;
      text-align: center;
    }

    section {
      margin-bottom: 2rem;
    }

    h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    h4 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      margin-top: 1rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-header h2 {
      margin-bottom: 0;
    }

    .toggle-button {
      background: none;
      border: 1px solid #d1d1d1;
      border-radius: 4px;
      padding: 0.5rem 1rem;
      cursor: pointer;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .toggle-button:hover {
      background-color: #f5f5f5;
    }

    @media (prefers-color-scheme: dark) {
      .toggle-button {
        border-color: #404040;
        color: #e5e5e5;
      }
      .toggle-button:hover {
        background-color: #1a1a1a;
      }
    }

    .toggle-icon {
      transition: transform 0.2s;
    }

    .toggle-button[aria-expanded="false"] .toggle-icon {
      transform: rotate(-90deg);
    }

    .section-content {
      overflow: hidden;
      transition: max-height 0.3s ease-out, opacity 0.2s;
    }

    .section-content.collapsed {
      max-height: 0;
      opacity: 0;
      margin: 0;
      padding: 0;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }

    .summary-item {
      background-color: #f9f9f9;
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
    }

    @media (prefers-color-scheme: dark) {
      .summary-item {
        background-color: #1a1a1a;
        border-color: #404040;
      }
    }

    .summary-label {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    @media (prefers-color-scheme: dark) {
      .summary-label {
        color: #999;
      }
    }

    .summary-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a1a;
    }

    @media (prefers-color-scheme: dark) {
      .summary-value {
        color: #e5e5e5;
      }
    }

    .meal-item {
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
      background-color: #ffffff;
    }

    @media (prefers-color-scheme: dark) {
      .meal-item {
        border-color: #404040;
        background-color: #0a0a0a;
      }
    }

    .meal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .meal-header h3 {
      margin-bottom: 0;
    }

    .meal-content {
      overflow: hidden;
      transition: max-height 0.3s ease-out, opacity 0.2s;
      margin-top: 1rem;
    }

    .meal-content.collapsed {
      max-height: 0;
      opacity: 0;
      margin: 0;
      padding: 0;
    }

    .meal-summary {
      margin-bottom: 1rem;
    }

    .meal-detail {
      margin-bottom: 1rem;
    }

    .meal-detail p {
      white-space: pre-wrap;
      margin-top: 0.5rem;
    }

    @media print {
      .toggle-button {
        display: none;
      }
      .section-content,
      .meal-content {
        max-height: none !important;
        opacity: 1 !important;
      }
      .section-content.collapsed,
      .meal-content.collapsed {
        display: block !important;
      }
    }

    @media (max-width: 768px) {
      body {
        padding: 1rem;
      }
      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .title {
        font-size: 1.5rem;
      }
    }`;
  }

  /**
   * Returns embedded JavaScript for expand/collapse functionality.
   * @param t - Translation function
   */
  private getScript(t: ReturnType<typeof getExportTranslations>): string {
    // Escape JavaScript string literals to prevent injection
    const collapseText = this.escapeJsString(t["export.collapse"]);
    const expandText = this.escapeJsString(t["export.expand"]);

    return `
    (function() {
      function initCollapsible() {
        const collapsibles = document.querySelectorAll('[data-collapsible]');
        const collapseText = '${collapseText}';
        const expandText = '${expandText}';
        
        collapsibles.forEach(function(section) {
          const button = section.querySelector('.toggle-button');
          const content = section.querySelector('.section-content, .meal-content');
          
          if (!button || !content) return;
          
          button.addEventListener('click', function() {
            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            const newState = !isExpanded;
            
            button.setAttribute('aria-expanded', newState.toString());
            const toggleText = button.querySelector('.toggle-text');
            if (toggleText) {
              toggleText.textContent = newState ? collapseText : expandText;
            }
            
            if (newState) {
              content.classList.remove('collapsed');
              content.style.maxHeight = content.scrollHeight + 'px';
            } else {
              content.style.maxHeight = content.scrollHeight + 'px';
              // Force reflow
              content.offsetHeight;
              content.classList.add('collapsed');
              content.style.maxHeight = '0';
            }
          });
          
          // Initialize content height
          if (button.getAttribute('aria-expanded') === 'true') {
            content.style.maxHeight = content.scrollHeight + 'px';
          }
        });
      }
      
      // Initialize on DOM ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCollapsible);
      } else {
        initCollapsible();
      }
    })();`;
  }

  /**
   * Escapes JavaScript string literals to prevent injection.
   * @param text - Text to escape
   * @returns Escaped JavaScript string
   */
  private escapeJsString(text: string): string {
    return String(text)
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
  }

  /**
   * Sanitizes filename for safe file system usage (reused from doc-generator).
   * @param name - The meal plan name
   * @returns Sanitized filename
   */
  sanitizeFilename(name: string): string {
    return sanitizeFilenameFromDoc(name);
  }
}
