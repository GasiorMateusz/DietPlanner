/**
 * Simplified terms loader that loads JSON files instead of parsing markdown.
 */

import type { TermsContent } from "./terms.types";

/**
 * Loads terms and privacy policy content from JSON file.
 * @param language - Language code ("en" or "pl")
 * @returns Parsed terms content
 * @throws Error if file cannot be loaded or parsed
 */
export async function loadTermsContent(language: "en" | "pl"): Promise<TermsContent> {
  try {
    const filePath = `/terms-privacy-policy.${language}.json`;
    const response = await fetch(filePath);

    if (!response.ok) {
      // Fallback to English if language file not found
      if (language !== "en") {
        return loadTermsContent("en");
      }
      throw new Error(`Failed to load terms: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Validate structure (basic check)
    if (!data.terms || !data.privacy || !Array.isArray(data.terms.sections) || !Array.isArray(data.privacy.sections)) {
      throw new Error("Invalid terms content structure");
    }

    return data as TermsContent;
  } catch (error) {
    // If error and not already English, try English as fallback
    if (language !== "en" && error instanceof Error) {
      try {
        return loadTermsContent("en");
      } catch {
        // If English also fails, throw original error
        throw error;
      }
    }
    throw error;
  }
}
