import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the AI Chat Interface page.
 * Encapsulates interactions with the AI conversation interface.
 */
export class AIChatPage {
  readonly page: Page;
  readonly interface: Locator;
  readonly initializingText: Locator;
  readonly messageHistory: Locator;
  readonly messageForm: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly acceptButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.interface = page.getByTestId("ai-chat-interface");
    this.initializingText = page.getByTestId("ai-chat-initializing");
    this.messageHistory = page.getByTestId("ai-chat-message-history");
    this.messageForm = page.getByTestId("ai-chat-message-form");
    this.messageInput = page.getByTestId("ai-chat-message-input");
    this.sendButton = page.getByTestId("ai-chat-send-button");
    this.acceptButton = page.getByTestId("ai-chat-accept-button");
  }

  /**
   * Waits for the chat interface to initialize.
   */
  async waitForInitialization(): Promise<void> {
    // Ensure we're on the create or edit page
    const currentUrl = this.page.url();
    if (!currentUrl.includes("/app/create") && !currentUrl.includes("/app/edit/")) {
      throw new Error(`Expected to be on /app/create or /app/edit/, but was on ${currentUrl}`);
    }

    // Wait for either initializing text or the interface to appear
    // The component shows initializing text first, then the full interface
    const initializingOrInterface = this.page
      .locator('[data-testid="ai-chat-initializing"], [data-testid="ai-chat-interface"]')
      .first();
    await initializingOrInterface.waitFor({ state: "visible", timeout: 30000 });

    // Check if initializing text is visible
    const isInitializingVisible = await this.initializingText.isVisible().catch(() => false);

    if (isInitializingVisible) {
      // Wait for initialization to complete (initializing text disappears and interface appears)
      await this.initializingText.waitFor({ state: "hidden", timeout: 60000 });
    }

    // Now wait for the full interface to be visible
    await this.interface.waitFor({ state: "visible", timeout: 10000 });

    // Check if there's an error alert (but ignore the AI disclaimer alert)
    const errorAlert = this.page
      .locator('[role="alert"]')
      .filter({ hasText: /error|Error|failed|Failed|noStartupData|initError|noSession/i })
      .first();
    const hasError = await errorAlert.isVisible().catch(() => false);

    if (hasError) {
      const errorText = await errorAlert.textContent();
      throw new Error(`AI chat initialization failed: ${errorText || "Unknown error"}`);
    }

    // Wait for message input to be visible (this is the final check)
    await this.messageInput.waitFor({ state: "visible", timeout: 30000 });
  }

  /**
   * Sends a message to the AI.
   */
  async sendMessage(message: string): Promise<void> {
    await this.messageInput.fill(message);
    await this.sendButton.click();
  }

  /**
   * Waits for AI response to complete.
   */
  async waitForAIResponse(): Promise<void> {
    // Wait for message input to be visible again (loading finished)
    // This also ensures the send button text has returned to "Send" (not "Sending...")
    await this.messageInput.waitFor({ state: "visible", timeout: 60000 });

    // Wait for accept button to be visible
    await this.acceptButton.waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Clicks the accept button (opens modal for plan name in create mode, saves directly in edit mode).
   */
  async accept(): Promise<void> {
    await this.acceptButton.click();
  }

  /**
   * Waits for the save plan modal to appear after accepting.
   */
  async waitForSavePlanModal(): Promise<void> {
    await this.page.getByTestId("save-plan-modal").waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Fills the plan name in the save plan modal.
   */
  async fillPlanNameInModal(planName: string): Promise<void> {
    const modal = this.page.getByTestId("save-plan-modal");
    await modal.waitFor({ state: "visible", timeout: 10000 });
    const input = this.page.getByTestId("plan-name-modal-input");
    await input.fill(planName);
  }

  /**
   * Submits the plan name modal (saves the plan and navigates to view page).
   */
  async submitPlanNameModal(): Promise<void> {
    const submitButton = this.page.getByTestId("save-plan-modal-submit");
    await submitButton.click();
    // Wait for navigation to view page
    await this.page.waitForURL(/\/app\/view\/[^/]+/, { timeout: 20000 });
  }

  /**
   * Performs the complete flow: send message, wait for response, and accept.
   * Note: After accepting, a modal opens for plan name (in create mode).
   */
  async sendMessageAndAccept(message: string): Promise<void> {
    await this.sendMessage(message);
    await this.waitForAIResponse();
    await this.accept();
    await this.waitForSavePlanModal();
  }
}
