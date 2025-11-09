/**
 * Supported language codes.
 */
export type LanguageCode = "en" | "pl";

/**
 * Translation keys used throughout the application.
 * Follows hierarchical naming convention (e.g., nav.logout, auth.email).
 */
export type TranslationKey =
  | "nav.logout"
  | "nav.deleteAccount"
  | "nav.login"
  | "nav.language"
  | "nav.language.english"
  | "nav.language.polish"
  | "auth.email"
  | "auth.password"
  | "auth.confirmPassword"
  | "auth.login"
  | "auth.register"
  | "auth.forgotPassword"
  | "auth.resetPassword"
  | "auth.termsAccept"
  | "auth.createAccount"
  | "auth.loggingOut"
  | "auth.loggingIn"
  | "auth.creatingAccount"
  | "auth.loginError"
  | "auth.invalidCredentials"
  | "auth.registerError"
  | "auth.emailExists"
  | "auth.passwordRequirements"
  | "auth.registerFailed"
  | "auth.accountCreated"
  | "auth.alreadyHaveAccount"
  | "auth.passwordHint"
  | "dashboard.title"
  | "dashboard.createPlan"
  | "dashboard.noPlans"
  | "dashboard.searchPlaceholder"
  | "dashboard.emptyState.title"
  | "dashboard.emptyState.description"
  | "dashboard.emptyState.createButton"
  | "chat.send"
  | "chat.placeholder"
  | "chat.loading"
  | "chat.sending"
  | "chat.sendHint"
  | "chat.initializing"
  | "chat.noSession"
  | "chat.sendError"
  | "chat.noStartupData"
  | "chat.initError"
  | "chat.aiDisclaimer"
  | "chat.currentPlan"
  | "chat.meals"
  | "chat.noMeals"
  | "chat.acceptButton"
  | "chat.noPlanToAccept"
  | "chat.promptsSent"
  | "editor.save"
  | "editor.export"
  | "common.loading"
  | "common.error"
  | "common.success"
  | "common.cancel"
  | "common.confirm"
  | "common.delete"
  | "common.save"
  | "common.deleting"
  | "dialog.deleteMealPlan.title"
  | "dialog.deleteMealPlan.description"
  | "dialog.deleteMealPlan.descriptionWithName";

/**
 * Record type mapping translation keys to their translated string values.
 */
export type Translations = Record<TranslationKey, string>;

/**
 * Language preference data structure.
 */
export interface LanguagePreference {
  language: LanguageCode;
}
