import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { DailySummaryStaticDisplay } from "./DailySummaryStaticDisplay";
import { MealCardReadOnly } from "./MealCardReadOnly";
import { MessageItem } from "./MessageItem";
import { MultiDayMealPlanDisplay } from "./MultiDayMealPlanDisplay";
import { extractCurrentMealPlan, extractCurrentMultiDayPlan } from "../lib/utils/chat-helpers";
import { aiChatApi } from "@/lib/api/ai-chat.client";
import { multiDayPlansApi } from "@/lib/api/multi-day-plans.client";
import { useAIChatForm } from "./hooks/useAIChatForm";
import type {
  ChatMessage,
  UserChatMessage,
  AssistantChatMessage,
  MealPlanStartupData,
  MultiDayStartupFormData,
} from "../types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { TranslationKey } from "@/lib/i18n/types";
import plTranslations from "@/lib/i18n/translations/pl.json";
import enTranslations from "@/lib/i18n/translations/en.json";

/**
 * State structure for managing chat state.
 */
interface ChatState {
  messageHistory: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  errorKey: TranslationKey | null; // Store translation key for errors that should be translated
  promptCount: number;
}

interface AIChatInterfaceProps {
  editMode?: boolean;
  existingPlanId?: string;
}

export default function AIChatInterface({ editMode = false, existingPlanId }: AIChatInterfaceProps) {
  const { t } = useTranslation();
  const [chatState, setChatState] = useState<ChatState>({
    messageHistory: [],
    isLoading: false,
    error: null,
    errorKey: null,
    promptCount: 0,
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startupData, setStartupData] = useState<MealPlanStartupData | MultiDayStartupFormData | null>(null);
  const [savePlanModalOpen, setSavePlanModalOpen] = useState(false);
  const [planName, setPlanName] = useState("");
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [existingPlanName, setExistingPlanName] = useState<string | null>(null);
  const [createNewPlan, setCreateNewPlan] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const initializationAttemptedRef = useRef(false);

  const isMultiDayPlan = useMemo(() => {
    // For edit mode, we always use multi_day_plan structure (even for 1-day plans)
    // Check message history first to see what structure we actually have
    if (editMode) {
      if (chatState.messageHistory.length > 0) {
        const lastMessage = chatState.messageHistory[chatState.messageHistory.length - 1];
        if (lastMessage.role === "assistant") {
          if (lastMessage.content.includes('"multi_day_plan"')) {
            return true;
          }
          if (lastMessage.content.includes('"meal_plan"') && !lastMessage.content.includes('"multi_day_plan"')) {
            return false;
          }
        }
      }
      // If we're in edit mode but no message history yet, assume multi_day_plan structure
      // (since we always create multi_day_plan structure in edit mode)
      return true;
    }
    // For create mode, use startup data
    return startupData !== null && "number_of_days" in startupData && startupData.number_of_days > 1;
  }, [startupData, editMode, chatState.messageHistory]);

  const { form, handleSubmit, maxLength } = useAIChatForm(async (message) => {
    if (!sessionId) {
      setChatState((prev) => ({
        ...prev,
        error: null,
        errorKey: "chat.noSession",
      }));
      return;
    }

    setChatState((prev) => ({ ...prev, error: null, errorKey: null }));

    const userMessage: UserChatMessage = {
      role: "user",
      content: message,
    };

    setChatState((prev) => ({
      ...prev,
      messageHistory: [...prev.messageHistory, userMessage],
      isLoading: true,
    }));

    try {
      const response = await aiChatApi.sendMessage(sessionId, { message: userMessage });

      setChatState((prev) => ({
        ...prev,
        messageHistory: [...prev.messageHistory, response.message],
        promptCount: response.prompt_count,
        isLoading: false,
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error sending message:", error);
      const errorMessage = error instanceof Error ? error.message : null;
      const errorKey = error instanceof Error ? null : "chat.sendError";

      if (errorMessage && (errorMessage.includes("Session not found") || errorMessage.includes("not found"))) {
        setSessionId(null);
      }

      setChatState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        errorKey,
      }));

      form.setValue("message", message);
    }
  });

  const initializeChat = useCallback(async () => {
    if (initializationAttemptedRef.current || sessionId !== null) {
      return;
    }

    initializationAttemptedRef.current = true;

    try {
      // Edit mode: Load existing plan
      if (editMode && existingPlanId) {
        setChatState((prev) => ({ ...prev, isLoading: true, error: null, errorKey: null }));

        const existingPlan = await multiDayPlansApi.getById(existingPlanId);

        // Store existing plan name for rename functionality
        setExistingPlanName(existingPlan.name);

        // Extract startup data from first day plan (they should all have similar startup data)
        const firstDay = existingPlan.days[0];
        if (!firstDay) {
          throw new Error("Plan has no days");
        }

        const extractedStartupData: MultiDayStartupFormData = {
          patient_age: firstDay.day_plan.patient_age,
          patient_weight: firstDay.day_plan.patient_weight,
          patient_height: firstDay.day_plan.patient_height,
          activity_level: firstDay.day_plan.activity_level,
          target_kcal: firstDay.day_plan.target_kcal,
          target_macro_distribution: firstDay.day_plan.target_macro_distribution,
          meal_names: firstDay.day_plan.meal_names,
          exclusions_guidelines: existingPlan.common_exclusions_guidelines || firstDay.day_plan.exclusions_guidelines,
          number_of_days: existingPlan.number_of_days,
          ensure_meal_variety: true, // Default, we don't store this
          different_guidelines_per_day: false, // Default
        };

        setStartupData(extractedStartupData);

        // Format existing plan as multi-day plan JSON structure for AI
        // Get translated comment based on current language
        // Read language directly from localStorage to ensure we get the correct language
        // even if the translation context hasn't fully loaded yet
        const currentLanguage =
          typeof window !== "undefined" ? (localStorage.getItem("app-language") as "en" | "pl" | null) || "en" : "en";
        // Use translations directly to avoid timing issues with translation context
        const translations = currentLanguage === "pl" ? plTranslations : enTranslations;
        const editCommentText =
          (translations["chat.editModeComment"] as string) ||
          (currentLanguage === "pl"
            ? "To jest aktualny {days}-dniowy plan żywieniowy. Możesz pomóc go zmodyfikować na podstawie próśb użytkownika."
            : "This is the current {days}-day meal plan. You can help modify it based on the user's requests.");
        const editComment = editCommentText.replace("{days}", existingPlan.number_of_days.toString());

        const multiDayPlanJson = {
          multi_day_plan: {
            days: existingPlan.days.map((day) => ({
              day_number: day.day_number,
              name: day.day_plan.name || undefined,
              meal_plan: {
                daily_summary: day.day_plan.plan_content.daily_summary,
                meals: day.day_plan.plan_content.meals.map((meal) => ({
                  name: meal.name,
                  ingredients: meal.ingredients,
                  preparation: meal.preparation,
                  summary: {
                    kcal: meal.summary.kcal,
                    protein: meal.summary.p,
                    fat: meal.summary.f,
                    carb: meal.summary.c,
                  },
                })),
              },
            })),
            summary: {
              number_of_days: existingPlan.number_of_days,
              average_kcal: existingPlan.average_kcal ?? 0,
              average_proteins: existingPlan.average_proteins ?? 0,
              average_fats: existingPlan.average_fats ?? 0,
              average_carbs: existingPlan.average_carbs ?? 0,
            },
          },
          comments: editComment,
        };

        // Create AI session with startup data
        const response = await aiChatApi.createSession(extractedStartupData);
        setSessionId(response.session_id);

        // Create initial assistant message with existing plan
        const initialMessage: AssistantChatMessage = {
          role: "assistant",
          content: JSON.stringify(multiDayPlanJson, null, 2),
        };

        setChatState((prev) => ({
          ...prev,
          messageHistory: [initialMessage],
          promptCount: response.prompt_count,
          isLoading: false,
        }));

        return;
      }

      // Create mode: Use startup data from sessionStorage
      const storedData = sessionStorage.getItem("mealPlanStartupData");
      if (!storedData) {
        setChatState((prev) => ({
          ...prev,
          error: null,
          errorKey: "chat.noStartupData",
        }));
        return;
      }

      const data: MealPlanStartupData | MultiDayStartupFormData = JSON.parse(storedData);
      setStartupData(data);

      const response = await aiChatApi.createSession(data);
      setSessionId(response.session_id);

      setChatState((prev) => ({
        ...prev,
        messageHistory: [response.message],
        promptCount: response.prompt_count,
      }));

      sessionStorage.removeItem("mealPlanStartupData");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to initialize chat:", error);
      setChatState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : null,
        errorKey: error instanceof Error ? null : "chat.initError",
      }));
      initializationAttemptedRef.current = false;
    }
  }, [sessionId, editMode, existingPlanId]);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatState.messageHistory]);

  const handleAccept = async () => {
    if (!sessionId) {
      setChatState((prev) => ({
        ...prev,
        error: null,
        errorKey: "chat.noSession",
      }));
      return;
    }

    // For edit mode, show modal with existing plan name pre-filled
    if (editMode && existingPlanId) {
      // Pre-fill with existing plan name or default
      setPlanName(existingPlanName || "");
      setSavePlanModalOpen(true);
      return;
    }

    // For create mode, show modal to get plan name
    if (isMultiDayPlan) {
      const multiDayPlan = currentMultiDayPlan;
      if (!multiDayPlan || !startupData || !("number_of_days" in startupData)) {
        setChatState((prev) => ({
          ...prev,
          error: null,
          errorKey: "chat.noPlanToAccept",
        }));
        return;
      }
      // Show modal for multi-day plan creation
      setPlanName(
        `Meal Plan - ${startupData.number_of_days} ${startupData.number_of_days === 1 ? t("startup.day") : t("startup.days")}`
      );
      setSavePlanModalOpen(true);
    } else {
      // Single-day plan - show modal
      setPlanName("");
      setSavePlanModalOpen(true);
    }
  };

  const savePlanWithName = async (providedName: string | null) => {
    if (!sessionId) {
      setChatState((prev) => ({
        ...prev,
        error: null,
        errorKey: "chat.noSession",
      }));
      return;
    }

    try {
      setIsSavingPlan(true);
      setChatState((prev) => ({ ...prev, isLoading: true, error: null, errorKey: null }));

      if (isMultiDayPlan) {
        const multiDayPlan = currentMultiDayPlan;
        if (!multiDayPlan || !startupData) {
          setChatState((prev) => ({
            ...prev,
            error: null,
            errorKey: "chat.noPlanToAccept",
          }));
          setIsSavingPlan(false);
          return;
        }

        // Debug: Log extracted multi-day plan
        // eslint-disable-next-line no-console
        console.log("[savePlanWithName] Extracted multi-day plan:", {
          totalDays: multiDayPlan.days.length,
          dayNumbers: multiDayPlan.days.map((d) => d.day_number),
          summary: multiDayPlan.summary,
        });

        // Calculate number_of_days from actual day plans (may have changed during conversation)
        const calculatedNumberOfDays = multiDayPlan.days.length;

        const dayPlansData = multiDayPlan.days.map((day) => ({
          day_number: day.day_number,
          plan_content: day.plan_content,
          startup_data: {
            patient_age: startupData.patient_age,
            patient_weight: startupData.patient_weight,
            patient_height: startupData.patient_height,
            activity_level: startupData.activity_level,
            target_kcal: startupData.target_kcal,
            target_macro_distribution: startupData.target_macro_distribution,
            meal_names: startupData.meal_names,
            exclusions_guidelines: startupData.exclusions_guidelines,
          },
          name: day.name,
        }));

        // Debug: Log prepared day plans data
        // eslint-disable-next-line no-console
        console.log("[savePlanWithName] Prepared day plans data:", {
          count: dayPlansData.length,
          dayNumbers: dayPlansData.map((d) => d.day_number),
          dayNames: dayPlansData.map((d) => d.name),
        });

        if (editMode && existingPlanId && !createNewPlan) {
          // Update existing plan
          const finalPlanName = providedName || planName || existingPlanName || "Meal Plan";

          const updateCommand = {
            name: finalPlanName,
            day_plans: dayPlansData,
            common_exclusions_guidelines: startupData.exclusions_guidelines,
            common_allergens: null,
          };

          // Debug: Log update command before sending
          // eslint-disable-next-line no-console
          console.log("[savePlanWithName] Update command:", {
            plan_id: existingPlanId,
            name: updateCommand.name,
            day_plans_count: updateCommand.day_plans.length,
            day_plans_day_numbers: updateCommand.day_plans.map((d) => d.day_number),
          });

          const response = await multiDayPlansApi.update(existingPlanId, updateCommand);
          window.location.href = `/app/view/${response.id}`;
        } else {
          // Create new plan with provided name
          const finalPlanName =
            providedName ||
            planName ||
            `Meal Plan - ${calculatedNumberOfDays} ${calculatedNumberOfDays === 1 ? t("startup.day") : t("startup.days")}`;

          const createCommand = {
            name: finalPlanName,
            source_chat_session_id: sessionId,
            number_of_days: calculatedNumberOfDays,
            common_exclusions_guidelines: startupData.exclusions_guidelines,
            common_allergens: null,
            day_plans: dayPlansData,
          };

          // Debug: Log create command before sending
          // eslint-disable-next-line no-console
          console.log("[savePlanWithName] Create command:", {
            name: createCommand.name,
            number_of_days: createCommand.number_of_days,
            day_plans_count: createCommand.day_plans.length,
            day_plans_day_numbers: createCommand.day_plans.map((d) => d.day_number),
          });

          const response = await multiDayPlansApi.create(createCommand);
          window.location.href = `/app/view/${response.id}`;
        }
      } else {
        // Single-day plan - convert to multi-day plan format and save directly
        const mealPlan = currentMealPlan;
        if (!mealPlan || !startupData) {
          setChatState((prev) => ({
            ...prev,
            error: null,
            errorKey: "chat.noPlanToAccept",
          }));
          setIsSavingPlan(false);
          return;
        }

        // Convert single-day plan to multi-day plan format (1 day)
        const finalPlanName = providedName || planName || `Meal Plan - 1 ${t("startup.day")}`;

        const createCommand = {
          name: finalPlanName,
          source_chat_session_id: sessionId,
          number_of_days: 1,
          common_exclusions_guidelines: startupData.exclusions_guidelines,
          common_allergens: null,
          day_plans: [
            {
              day_number: 1,
              plan_content: {
                daily_summary: mealPlan.dailySummary,
                meals: mealPlan.meals,
              },
              startup_data: {
                patient_age: startupData.patient_age,
                patient_weight: startupData.patient_weight,
                patient_height: startupData.patient_height,
                activity_level: startupData.activity_level,
                target_kcal: startupData.target_kcal,
                target_macro_distribution: startupData.target_macro_distribution,
                meal_names: startupData.meal_names,
                exclusions_guidelines: startupData.exclusions_guidelines,
              },
            },
          ],
        };

        const response = await multiDayPlansApi.create(createCommand);
        window.location.href = `/app/view/${response.id}`;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error ${editMode ? "updating" : "creating"} meal plan:`, error);
      const errorMessage = error instanceof Error ? error.message : null;
      const errorKey = error instanceof Error ? null : "chat.acceptError";
      setChatState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        errorKey,
      }));
      setIsSavingPlan(false);
    }
  };

  const handleSavePlanModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) {
      return;
    }
    setSavePlanModalOpen(false);
    savePlanWithName(planName.trim());
    // Reset checkbox state after submission
    setCreateNewPlan(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      (e.currentTarget.form as HTMLFormElement)?.requestSubmit();
    }
  };

  const currentMealPlan = useMemo(() => {
    if (isMultiDayPlan) return null;
    return extractCurrentMealPlan(chatState.messageHistory);
  }, [chatState.messageHistory, isMultiDayPlan]);

  const currentMultiDayPlan = useMemo(() => {
    if (!isMultiDayPlan) return null;
    return extractCurrentMultiDayPlan(chatState.messageHistory);
  }, [chatState.messageHistory, isMultiDayPlan]);

  if (chatState.messageHistory.length === 0 && !chatState.error) {
    return (
      <div className="container mx-auto p-4 sm:p-8 max-w-4xl">
        <div className="text-center py-20">
          <p className="text-muted-foreground" data-testid="ai-chat-initializing">
            {t("chat.initializing")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-4xl" data-testid="ai-chat-interface">
      <Alert className="mb-6">
        <AlertDescription>{t("chat.aiDisclaimer")}</AlertDescription>
      </Alert>

      {(chatState.error || chatState.errorKey) && (
        <Alert className="mb-6 border-destructive bg-destructive/10 text-destructive">
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{chatState.errorKey ? t(chatState.errorKey) : chatState.error}</span>
            {(!sessionId ||
              (chatState.error &&
                (chatState.error.includes("Session not found") || chatState.error.includes("not found"))) ||
              chatState.errorKey === "chat.noStartupData" ||
              chatState.errorKey === "chat.noSession") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.href = "/app/dashboard";
                }}
              >
                {t("chat.goToDashboard")}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isMultiDayPlan && currentMultiDayPlan ? (
        <div className="mb-6 space-y-4 border rounded-lg p-6 bg-background">
          <h2 className="text-2xl font-bold">{t("chat.currentPlan")}</h2>
          <MultiDayMealPlanDisplay planData={currentMultiDayPlan} />
        </div>
      ) : isMultiDayPlan && !currentMultiDayPlan && chatState.messageHistory.length > 0 ? (
        <Alert className="mb-6 border-yellow-500 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
          <AlertDescription>
            {t("chat.multiDayPlanParseError") ||
              "Unable to display multi-day plan. The AI response may be in an incorrect format. Please try creating a new plan from the dashboard."}
          </AlertDescription>
        </Alert>
      ) : currentMealPlan && !isMultiDayPlan ? (
        <div className="mb-6 space-y-4 border rounded-lg p-6 bg-background">
          <h2 className="text-2xl font-bold">{t("chat.currentPlan")}</h2>

          {/* Daily Summary */}
          <DailySummaryStaticDisplay summary={currentMealPlan.dailySummary} />

          {/* Meals List */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{t("chat.meals")}</h3>
            {currentMealPlan.meals.length > 0 ? (
              <div className="space-y-4">
                {currentMealPlan.meals.map((meal, index) => (
                  <MealCardReadOnly key={index} meal={meal} mealIndex={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">{t("chat.noMeals")}</div>
            )}
          </div>
        </div>
      ) : null}

      <div
        className="space-y-4 mb-6 min-h-[400px] max-h-[600px] overflow-y-auto p-4 border rounded-lg bg-background"
        data-testid="ai-chat-message-history"
      >
        {chatState.messageHistory.map((message, index) => (
          <MessageItem key={index} message={message} />
        ))}
        <div ref={messageEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" data-testid="ai-chat-message-form">
        <div className="space-y-2">
          <Textarea
            {...form.register("message")}
            onKeyDown={handleKeyDown}
            placeholder={t("chat.placeholder")}
            disabled={chatState.isLoading || !sessionId}
            className="min-h-[100px] resize-none"
            maxLength={maxLength}
            data-testid="ai-chat-message-input"
          />
          {form.formState.errors.message && (
            <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>
          )}
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>{t("chat.sendHint")}</span>
            <span>
              {form.watch("message").length} / {maxLength}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={!form.watch("message").trim() || chatState.isLoading || !sessionId || !form.formState.isValid}
            className="flex-1"
            data-testid="ai-chat-send-button"
          >
            {chatState.isLoading ? t("chat.sending") : t("chat.send")}
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleAccept}
            disabled={chatState.isLoading || !sessionId}
            data-testid="ai-chat-accept-button"
          >
            {t("chat.acceptButton")}
          </Button>
        </div>
      </form>

      {chatState.promptCount > 0 && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {t("chat.promptsSent")} {chatState.promptCount}
        </div>
      )}

      {/* Save Plan Modal */}
      <Dialog
        open={savePlanModalOpen}
        onOpenChange={(open) => {
          setSavePlanModalOpen(open);
          if (!open) {
            // Reset checkbox when modal is closed
            setCreateNewPlan(false);
          }
        }}
      >
        <DialogContent data-testid="save-plan-modal">
          <DialogHeader>
            <DialogTitle>
              {editMode
                ? t("chat.savePlanModal.editTitle") || t("chat.savePlanModal.title")
                : t("chat.savePlanModal.title")}
            </DialogTitle>
            <DialogDescription>
              {editMode
                ? t("chat.savePlanModal.editDescription") || t("chat.savePlanModal.description")
                : t("chat.savePlanModal.description")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSavePlanModalSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name-modal">
                {t("chat.savePlanModal.planName")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="plan-name-modal"
                data-testid="plan-name-modal-input"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder={t("chat.savePlanModal.planNamePlaceholder")}
                disabled={isSavingPlan}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                required
              />
            </div>
            {editMode && (
              <div className="flex items-start space-x-2 space-y-0 rounded-md border p-4">
                <Checkbox
                  id="create-new-plan"
                  checked={createNewPlan}
                  onCheckedChange={(checked) => setCreateNewPlan(checked === true)}
                  disabled={isSavingPlan}
                />
                <div className="space-y-1 leading-none">
                  <Label
                    htmlFor="create-new-plan"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {t("chat.savePlanModal.createNew")}
                  </Label>
                  <p className="text-xs text-muted-foreground">{t("chat.savePlanModal.createNewDescription")}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSavePlanModalOpen(false)}
                disabled={isSavingPlan}
              >
                {t("chat.savePlanModal.cancel")}
              </Button>
              <Button type="submit" disabled={!planName.trim() || isSavingPlan} data-testid="save-plan-modal-submit">
                {isSavingPlan ? t("chat.savePlanModal.saving") : t("chat.savePlanModal.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
