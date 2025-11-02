import { useState, useEffect, useRef, useMemo } from "react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { DailySummaryStaticDisplay } from "./DailySummaryStaticDisplay";
import { MealCardReadOnly } from "./MealCardReadOnly";
import { parseXmlMealPlan, removeXmlTags, extractComments } from "../lib/utils/meal-plan-parser";
import { getAuthToken } from "@/lib/auth/get-auth-token";
import type {
  ChatMessage,
  AssistantChatMessage,
  UserChatMessage,
  SendAiMessageCommand,
  SendAiMessageResponseDto,
  CreateAiSessionResponseDto,
  MealPlanStartupData,
} from "../types";

const MAX_MESSAGE_LENGTH = 5000;

/**
 * State structure for managing chat state.
 */
interface ChatState {
  messageHistory: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  promptCount: number;
}

/**
 * State bridge interface for passing data to editor view.
 */
interface StateBridge {
  sessionId: string;
  lastAssistantMessage: string;
  startupData?: MealPlanStartupData;
}

/**
 * Main container component for the AI chat interface.
 * Manages all chat-related state, handles API calls for sending messages,
 * displays the conversation history, and provides controls for user input and acceptance.
 */
export default function AIChatInterface() {
  const [chatState, setChatState] = useState<ChatState>({
    messageHistory: [],
    isLoading: false,
    error: null,
    promptCount: 0,
  });
  const [inputValue, setInputValue] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startupData, setStartupData] = useState<MealPlanStartupData | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  /**
   * Initialize chat session from startup data stored in sessionStorage.
   */
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Read startup data from sessionStorage
        const storedData = sessionStorage.getItem("mealPlanStartupData");
        if (!storedData) {
          setChatState((prev) => ({
            ...prev,
            error: "No startup data found. Please start from the dashboard.",
          }));
          return;
        }

        const data: MealPlanStartupData = JSON.parse(storedData);
        setStartupData(data);

        // Create initial AI session
        const response = await createAiSession(data);
        setSessionId(response.session_id);

        // Initialize message history with first assistant message
        setChatState((prev) => ({
          ...prev,
          messageHistory: [response.message],
          promptCount: response.prompt_count,
        }));

        // Clear sessionStorage after successful initialization
        sessionStorage.removeItem("mealPlanStartupData");
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        setChatState((prev) => ({
          ...prev,
          error: "Failed to initialize AI chat session. Please try again.",
        }));
      }
    };

    initializeChat();
  }, []);

  /**
   * Auto-scroll to bottom when new messages arrive.
   */
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatState.messageHistory]);

  /**
   * Creates a new AI chat session.
   */
  const createAiSession = async (data: MealPlanStartupData): Promise<CreateAiSessionResponseDto> => {
    const token = await getAuthToken();
    if (!token) {
      window.location.href = "/auth/login";
      throw new Error("Unauthorized");
    }
    const response = await fetch("/api/ai/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = "/auth/login";
        throw new Error("Unauthorized");
      }
      const errorData = await response.json().catch(() => ({ error: "An internal error occurred" }));
      throw new Error(errorData.error || "Failed to create AI session");
    }

    return response.json();
  };

  /**
   * Sends a follow-up message to the AI.
   */
  const sendMessage = async (sessionId: string, message: UserChatMessage): Promise<SendAiMessageResponseDto> => {
    const token = await getAuthToken();
    if (!token) {
      window.location.href = "/auth/login";
      throw new Error("Unauthorized");
    }
    const response = await fetch(`/api/ai/sessions/${sessionId}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message } satisfies SendAiMessageCommand),
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = "/auth/login";
        throw new Error("Unauthorized");
      }
      if (response.status === 404) {
        throw new Error("Session not found. Please start a new meal plan from the dashboard.");
      }
      if (response.status === 502) {
        throw new Error("AI service is temporarily unavailable. Please try again in a moment.");
      }
      if (response.status === 500) {
        throw new Error("An internal error occurred. Please try again later.");
      }
      const errorData = await response.json().catch(() => ({ error: "An internal error occurred" }));
      throw new Error(errorData.error || "Failed to send message");
    }

    return response.json();
  };

  /**
   * Handles form submission to send a message.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate input
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage) {
      return;
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setChatState((prev) => ({
        ...prev,
        error: "Message too long. Please shorten your message.",
      }));
      return;
    }

    if (!sessionId) {
      setChatState((prev) => ({
        ...prev,
        error: "No active session. Please refresh the page.",
      }));
      return;
    }

    // Clear error
    setChatState((prev) => ({ ...prev, error: null }));

    // Create user message
    const userMessage: UserChatMessage = {
      role: "user",
      content: trimmedMessage,
    };

    // Optimistically add user message
    setChatState((prev) => ({
      ...prev,
      messageHistory: [...prev.messageHistory, userMessage],
      isLoading: true,
    }));
    setInputValue("");

    try {
      // Send message to API
      const response = await sendMessage(sessionId, userMessage);

      // Add assistant response
      setChatState((prev) => ({
        ...prev,
        messageHistory: [...prev.messageHistory, response.message],
        promptCount: response.prompt_count,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic user message
      setChatState((prev) => ({
        ...prev,
        messageHistory: prev.messageHistory.slice(0, -1),
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to send message. Please try again.",
      }));
      // Restore input value
      setInputValue(trimmedMessage);
    }
  };

  /**
   * Handles Accept button click - navigates to editor with final plan.
   */
  const handleAccept = () => {
    if (!sessionId) {
      setChatState((prev) => ({
        ...prev,
        error: "No active session. Please refresh the page.",
      }));
      return;
    }

    // Get last assistant message
    const lastAssistantMessage = chatState.messageHistory
      .filter((msg): msg is AssistantChatMessage => msg.role === "assistant")
      .pop();

    if (!lastAssistantMessage) {
      setChatState((prev) => ({
        ...prev,
        error: "No meal plan available to accept.",
      }));
      return;
    }

    // Store in state bridge using sessionStorage (persists across navigation)
    const bridge: StateBridge = {
      sessionId,
      lastAssistantMessage: lastAssistantMessage.content,
      startupData: startupData || undefined,
    };

    sessionStorage.setItem("mealPlanBridge", JSON.stringify(bridge));

    // Navigate to editor
    window.location.href = "/app/editor";
  };

  /**
   * Handles textarea keydown for Enter with modifier.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      (e.currentTarget.form as HTMLFormElement)?.requestSubmit();
    }
  };

  /**
   * Extract meal plan from the latest assistant message.
   * Parses XML tags and returns structured meal plan data.
   */
  const currentMealPlan = useMemo(() => {
    const lastAssistantMessage = chatState.messageHistory
      .filter((msg): msg is AssistantChatMessage => msg.role === "assistant")
      .pop();

    if (!lastAssistantMessage) {
      return null;
    }

    try {
      const parsed = parseXmlMealPlan(lastAssistantMessage.content);
      // Only return if we actually found meals (not the fallback empty structure)
      if (
        parsed.meals.length > 0 &&
        parsed.meals[0].name !== "" &&
        parsed.meals[0].preparation !== lastAssistantMessage.content
      ) {
        return parsed;
      }
    } catch (error) {
      console.error("Failed to parse meal plan:", error);
    }

    return null;
  }, [chatState.messageHistory]);

  // Render empty state if no messages yet
  if (chatState.messageHistory.length === 0 && !chatState.error) {
    return (
      <div className="container mx-auto p-4 sm:p-8 max-w-4xl">
        <div className="text-center py-20">
          <p className="text-muted-foreground">Initializing AI chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-4xl">
      {/* AI Disclaimer Alert */}
      <Alert className="mb-6">
        <AlertDescription>
          This content is AI-generated. Please verify all information before using with patients.
        </AlertDescription>
      </Alert>

      {/* Error Alert */}
      {chatState.error && (
        <Alert className="mb-6 border-destructive bg-destructive/10 text-destructive">
          <AlertDescription>{chatState.error}</AlertDescription>
        </Alert>
      )}

      {/* Current Meal Plan Display - Always visible at the top */}
      {currentMealPlan && (
        <div className="mb-6 space-y-4 border rounded-lg p-6 bg-background">
          <h2 className="text-2xl font-bold">Current Meal Plan</h2>

          {/* Daily Summary */}
          <DailySummaryStaticDisplay summary={currentMealPlan.dailySummary} />

          {/* Meals List */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Meals</h3>
            {currentMealPlan.meals.length > 0 ? (
              <div className="space-y-4">
                {currentMealPlan.meals.map((meal, index) => (
                  <MealCardReadOnly key={index} meal={meal} mealIndex={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No meals available yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Message History */}
      <div className="space-y-4 mb-6 min-h-[400px] max-h-[600px] overflow-y-auto p-4 border rounded-lg bg-background">
        {chatState.messageHistory.map((message, index) => (
          <MessageItem key={index} message={message} />
        ))}
        <div ref={messageEndRef} />
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here... (Ctrl/Cmd+Enter to send)"
            disabled={chatState.isLoading || !sessionId}
            className="min-h-[100px] resize-none"
            maxLength={MAX_MESSAGE_LENGTH}
          />
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Press Ctrl/Cmd+Enter to send</span>
            <span>
              {inputValue.length} / {MAX_MESSAGE_LENGTH}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={!inputValue.trim() || chatState.isLoading || !sessionId} className="flex-1">
            {chatState.isLoading ? "Sending..." : "Send"}
          </Button>
          <Button type="button" variant="default" onClick={handleAccept} disabled={chatState.isLoading || !sessionId}>
            Accept and edit manually
          </Button>
        </div>
      </form>

      {/* Prompt Count (optional, for transparency) */}
      {chatState.promptCount > 0 && (
        <div className="mt-4 text-center text-sm text-muted-foreground">Prompts sent: {chatState.promptCount}</div>
      )}
    </div>
  );
}

/**
 * Individual message bubble component.
 * Renders either a user or assistant message with appropriate styling.
 * For assistant messages, removes XML tags to show clean text (preserves comments).
 */
function MessageItem({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-lg bg-primary text-primary-foreground px-4 py-2">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    );
  }

  // Extract comments and clean the message
  const comments = extractComments(message.content);
  const cleanedContent = removeXmlTags(message.content);

  // Display comments if available, otherwise show cleaned content or fallback message
  const displayText = comments || cleanedContent || "Meal plan updated above.";

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
        <p className="whitespace-pre-wrap break-words">{displayText}</p>
      </div>
    </div>
  );
}
