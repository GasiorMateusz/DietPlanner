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
    // Wait for initializing text to appear
    await this.initializingText.waitFor({ state: "visible", timeout: 30000 });

    // Wait for initialization to complete (text disappears)
    await this.initializingText.waitFor({ state: "hidden", timeout: 60000 });

    // Wait for message input to be visible
    await this.messageInput.waitFor({ state: "visible", timeout: 10000 });
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
   * Clicks the accept button to navigate to editor.
   */
  async accept(): Promise<void> {
    await this.acceptButton.click();
  }

  /**
   * Waits for navigation to the editor page after accepting.
   */
  async waitForNavigationToEditor(): Promise<void> {
    await this.page.waitForURL(/\/app\/editor/, { timeout: 10000 });
  }

  /**
   * Performs the complete flow: send message, wait for response, and accept.
   */
  async sendMessageAndAccept(message: string): Promise<void> {
    await this.sendMessage(message);
    await this.waitForAIResponse();
    await this.accept();
    await this.waitForNavigationToEditor();
  }
}
