import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const MAX_MESSAGE_LENGTH = 5000;

const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty.")
    .max(MAX_MESSAGE_LENGTH, `Message must be less than ${MAX_MESSAGE_LENGTH} characters.`),
});

type ChatMessageFormData = z.infer<typeof chatMessageSchema>;

/**
 * Custom hook for managing AI chat form state and validation.
 * Handles message input validation and submission.
 */
export function useAIChatForm(onSubmit: (message: string) => Promise<void>) {
  const form = useForm<ChatMessageFormData>({
    resolver: zodResolver(chatMessageSchema),
    defaultValues: {
      message: "",
    },
    mode: "onChange",
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    const trimmedMessage = data.message.trim();
    await onSubmit(trimmedMessage);
    form.reset();
  });

  return {
    form,
    handleSubmit,
    maxLength: MAX_MESSAGE_LENGTH,
  };
}
