/**
 * Terms and Privacy Policy configuration.
 * Defines the required section IDs for UX checkboxes (not stored in database).
 */
export const TERMS_CONFIG = {
  // List of required section IDs for Terms of Service (UX checkboxes only)
  // Reduced to 2 most important sections
  requiredTermsSections: ["user-responsibilities", "liability-limitations"] as const,

  // List of required section IDs for Privacy Policy (UX checkboxes only)
  // Reduced to 2 most important sections
  requiredPrivacySections: ["data-controller", "data-security"] as const,
} as const;

/**
 * All required section IDs (combines Terms and Privacy sections).
 */
export const ALL_REQUIRED_SECTIONS = [
  ...TERMS_CONFIG.requiredTermsSections,
  ...TERMS_CONFIG.requiredPrivacySections,
] as const;
