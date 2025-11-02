import { extractComments, removeXmlTags } from "../lib/utils/meal-plan-parser";
import type { ChatMessage } from "../types";

/**
 * Individual message bubble component.
 * Renders either a user or assistant message with appropriate styling.
 * For assistant messages, removes XML tags to show clean text (preserves comments).
 */
export function MessageItem({ message }: { message: ChatMessage }) {
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
