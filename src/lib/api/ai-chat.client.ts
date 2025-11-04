import type {
  CreateAiSessionCommand,
  CreateAiSessionResponseDto,
  SendAiMessageCommand,
  SendAiMessageResponseDto,
} from "@/types";
import { getAuthHeaders, handleApiResponse } from "./base.client";
import { getChatErrorMessage } from "@/lib/utils/chat-helpers";

/**
 * API client for AI chat operations.
 */
export const aiChatApi = {
  /**
   * Creates a new AI chat session.
   * @param command - Startup data for the meal plan
   * @returns Session ID and initial assistant message
   */
  async createSession(command: CreateAiSessionCommand): Promise<CreateAiSessionResponseDto> {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/ai/sessions", {
      method: "POST",
      headers,
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      // Use specialized error handling for chat endpoints
      const errorMessage = await getChatErrorMessage(response, "Failed to create AI session");
      throw new Error(errorMessage);
    }

    return handleApiResponse<CreateAiSessionResponseDto>(response);
  },

  /**
   * Sends a follow-up message to an AI chat session.
   * @param sessionId - Chat session ID
   * @param command - Message command containing the user message
   * @returns Session ID and assistant response
   */
  async sendMessage(sessionId: string, command: SendAiMessageCommand): Promise<SendAiMessageResponseDto> {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/ai/sessions/${sessionId}/message`, {
      method: "POST",
      headers,
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      // Use specialized error handling for chat endpoints
      const errorMessage = await getChatErrorMessage(response, "Failed to send message");
      throw new Error(errorMessage);
    }

    return handleApiResponse<SendAiMessageResponseDto>(response);
  },
};

