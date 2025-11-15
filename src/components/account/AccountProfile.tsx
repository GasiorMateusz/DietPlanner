import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { TermsAndPrivacyModal } from "@/components/terms/TermsAndPrivacyModal";
import { DeleteAccountConfirmationDialog } from "@/components/auth/DeleteAccountConfirmationDialog";
import { formatDate } from "@/lib/utils/date";
import { getAuthToken } from "@/lib/auth/get-auth-token";
import { supabaseClient as supabase } from "@/db/supabase.client";
import { userPreferencesApi } from "@/lib/api/user-preferences.client";
import { AVAILABLE_AI_MODELS, DEFAULT_AI_MODEL } from "@/lib/ai/models.config.ts";

interface AccountProfileProps {
  userEmail: string;
  termsAccepted: boolean;
  termsAcceptedAt: string | null;
}

/**
 * Account profile component that displays user account information,
 * provides access to Terms and Privacy Policy, and includes account management features.
 */
export function AccountProfile({ userEmail, termsAccepted, termsAcceptedAt }: AccountProfileProps) {
  const { t } = useTranslation();
  const [isTermsModalOpen, setIsTermsModalOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // AI Model Selection state
  const [selectedModel, setSelectedModel] = React.useState<string>("");
  const [savedModel, setSavedModel] = React.useState<string>("");
  const [isLoadingModel, setIsLoadingModel] = React.useState(false);
  const [isSavingModel, setIsSavingModel] = React.useState(false);
  const [modelError, setModelError] = React.useState<string | null>(null);
  const [modelSuccess, setModelSuccess] = React.useState(false);
  const [hasLoadedModel, setHasLoadedModel] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<"price" | "power" | "speed">("price");

  // Load AI model preference on mount (only once)
  React.useEffect(() => {
    // Prevent re-loading if already loaded or currently loading
    if (hasLoadedModel || isLoadingModel) {
      return;
    }

    const loadAiModelPreference = async () => {
      setIsLoadingModel(true);
      setModelError(null);
      try {
        const preference = await userPreferencesApi.getAiModelPreference();
        const modelId = preference.model;
        setSelectedModel(modelId);
        setSavedModel(modelId);
        setHasLoadedModel(true);
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error("Failed to load AI model preference:", error);
        }
        // Set error translation key - will be translated in render
        setModelError("account.modelLoadError");
        // Set defaults
        setSelectedModel(DEFAULT_AI_MODEL);
        setSavedModel(DEFAULT_AI_MODEL);
        setHasLoadedModel(true);
      } finally {
        setIsLoadingModel(false);
      }
    };

    loadAiModelPreference();
  }, []); // Empty array - only run once on mount. Guard prevents re-loading if already loaded

  // Handle Escape key to close dropdown
  React.useEffect(() => {
    if (!isDropdownOpen) {
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isDropdownOpen]);

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        setDeleteError(t("account.deleteAccountError"));
        setIsDeletingAccount(false);
        return;
      }

      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Session expired, redirect to login
          window.location.href = "/auth/login";
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        setDeleteError(errorData.error || t("account.deleteAccountError"));
        setIsDeletingAccount(false);
        return;
      }

      // Account deleted successfully
      // Sign out and redirect to home page
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("account.deleteAccountError");
      setDeleteError(errorMessage);
      setIsDeletingAccount(false);
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Error deleting account:", error);
      }
    }
  };

  // Handle change password (placeholder - to be implemented)
  const handleChangePassword = () => {
    // TODO: Implement change password functionality
    alert("Change password functionality will be implemented soon.");
  };

  // Handle model selection from custom dropdown
  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    setModelError(null);
    setModelSuccess(false);
    setIsDropdownOpen(false);
  };

  // Get selected model details
  const selectedModelData = React.useMemo(() => {
    return AVAILABLE_AI_MODELS.find((m) => m.id === selectedModel);
  }, [selectedModel]);

  // Sort models based on selected sort type
  const sortedModels = React.useMemo(() => {
    const models = [...AVAILABLE_AI_MODELS];
    if (sortBy === "price") {
      // Sort by price (ascending - cheapest first)
      return models.sort((a, b) => a.combinedPrice - b.combinedPrice);
    } else if (sortBy === "power") {
      // Sort by power (descending - highest power first)
      return models.sort((a, b) => b.powerRank - a.powerRank);
    } else {
      // Sort by speed (descending - fastest first)
      return models.sort((a, b) => b.speed - a.speed);
    }
  }, [sortBy]);

  // Handle save AI model preference
  const handleSaveModel = async () => {
    if (selectedModel === savedModel || isSavingModel) {
      return;
    }

    setIsSavingModel(true);
    setModelError(null);
    setModelSuccess(false);

    try {
      await userPreferencesApi.updateAiModelPreference({ model: selectedModel });
      setSavedModel(selectedModel);
      setModelSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => {
        setModelSuccess(false);
      }, 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("account.modelSaveError");
      setModelError(errorMessage);
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Failed to save AI model preference:", error);
      }
    } finally {
      setIsSavingModel(false);
    }
  };

  const hasModelChanges = selectedModel !== savedModel;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("account.title")}</h1>

      {/* Account Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("account.accountInformation")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">{t("account.email")}</div>
            <div className="text-base font-medium">{userEmail}</div>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Privacy Policy Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("account.termsAndPrivacy")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{t("account.acceptedAt")}</div>
              <div className="text-base">{termsAccepted ? t("account.accepted") : t("account.notAccepted")}</div>
              {termsAcceptedAt && <div className="text-xs text-muted-foreground">{formatDate(termsAcceptedAt)}</div>}
            </div>
            <Button variant="outline" onClick={() => setIsTermsModalOpen(true)}>
              {t("account.viewCurrentTerms")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Model Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("account.aiModelSelection")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="ai-model-select" className="text-sm text-muted-foreground">
                  {t("account.selectModel")}
                </label>
                {/* Sort Options */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">{t("account.sortBy")}:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sort-type"
                      value="price"
                      checked={sortBy === "price"}
                      onChange={(e) => setSortBy(e.target.value as "price" | "power" | "speed")}
                      className="cursor-pointer"
                    />
                    <span>{t("account.sortByPrice")}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sort-type"
                      value="power"
                      checked={sortBy === "power"}
                      onChange={(e) => setSortBy(e.target.value as "price" | "power" | "speed")}
                      className="cursor-pointer"
                    />
                    <span>{t("account.sortByPower")}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sort-type"
                      value="speed"
                      checked={sortBy === "speed"}
                      onChange={(e) => setSortBy(e.target.value as "price" | "power" | "speed")}
                      className="cursor-pointer"
                    />
                    <span>{t("account.sortBySpeed")}</span>
                  </label>
                </div>
              </div>
              {isLoadingModel ? (
                <div className="text-sm text-muted-foreground">{t("account.modelLoading")}</div>
              ) : (
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    disabled={isSavingModel}
                    className="w-full justify-between"
                    aria-haspopup="listbox"
                    aria-expanded={isDropdownOpen}
                  >
                    <span className="truncate">
                      {selectedModelData
                        ? `${selectedModelData.name} (${selectedModelData.provider}) - $${selectedModelData.combinedPrice.toFixed(2)} - Power: ${selectedModelData.powerRank} - Speed: ${selectedModelData.speed}`
                        : t("account.selectModel")}
                    </span>
                    <svg
                      className={`ml-2 h-4 w-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>
                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} aria-hidden="true" />
                      <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover shadow-lg">
                        <div className="max-h-[400px] overflow-auto p-1">
                          {/* Table Header */}
                          <div className="sticky top-0 z-10 grid grid-cols-[2fr_1fr_1fr_0.8fr_0.8fr] gap-2 border-b bg-background px-3 py-2 text-xs font-semibold text-muted-foreground">
                            <div>Model</div>
                            <div>Provider</div>
                            <div className="text-right">Price</div>
                            <div className="text-right">Power</div>
                            <div className="text-right">Speed</div>
                          </div>
                          {/* Table Rows */}
                          {sortedModels.map((model) => {
                            const isSelected = model.id === selectedModel;
                            return (
                              <button
                                key={model.id}
                                type="button"
                                onClick={() => handleModelSelect(model.id)}
                                className={`w-full grid grid-cols-[2fr_1fr_1fr_0.8fr_0.8fr] gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                                  isSelected ? "bg-accent text-accent-foreground" : ""
                                }`}
                              >
                                <div className="font-medium truncate">{model.name}</div>
                                <div className="text-muted-foreground truncate">{model.provider}</div>
                                <div className="text-right font-medium">${model.combinedPrice.toFixed(2)}</div>
                                <div className="text-right font-medium">{model.powerRank}</div>
                                <div className="text-right font-medium">{model.speed}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                  {modelSuccess && (
                    <div className="mt-2 text-sm text-green-600 dark:text-green-400">{t("account.modelSaved")}</div>
                  )}
                  {modelError && <div className="mt-2 text-sm text-destructive">{t(modelError)}</div>}
                </div>
              )}
            </div>
            <Button
              variant="default"
              onClick={handleSaveModel}
              disabled={!hasModelChanges || isSavingModel || isLoadingModel}
              className="w-full sm:w-auto"
            >
              {isSavingModel ? t("account.modelSaving") : t("account.saveModel")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Management Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("account.accountManagement")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" onClick={handleChangePassword} className="w-full sm:w-auto">
              {t("account.changePassword")}
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} className="w-full sm:w-auto">
              {t("account.deleteAccount")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Legal Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("account.legalInformation")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>{t("account.dataProcessorNotice")}</p>
            <p>{t("account.contactInformation")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Privacy Modal */}
      <TermsAndPrivacyModal
        open={isTermsModalOpen}
        onOpenChange={setIsTermsModalOpen}
        onAccept={() => setIsTermsModalOpen(false)}
        mode="view"
      />

      {/* Delete Account Confirmation Dialog */}
      <DeleteAccountConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeleteError(null);
        }}
        onConfirm={handleDeleteAccount}
        isDeleting={isDeletingAccount}
        error={deleteError}
      />
    </div>
  );
}
