import type { AiModel } from "../../types.ts";

/**
 * Available AI models with their metadata.
 * Models are ordered by price (cheapest first).
 */
export const AVAILABLE_AI_MODELS: AiModel[] = [
  {
    id: "google/gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "Google",
    inputPrice: 0.1,
    outputPrice: 0.4,
    combinedPrice: 0.1 * 0.2 + 0.4 * 0.8, // 0.34
    powerRank: 7, // Reversed from 4: higher is better
  },
  {
    id: "openai/gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    provider: "OpenAI",
    inputPrice: 0.1,
    outputPrice: 0.4,
    combinedPrice: 0.1 * 0.2 + 0.4 * 0.8, // 0.34
    powerRank: 5, // Changed from 5.5 to 6, then reversed: higher is better
  },
  {
    id: "meta-llama/llama-4-scout",
    name: "Llama 4 Scout",
    provider: "Meta",
    inputPrice: 0.18,
    outputPrice: 0.59,
    combinedPrice: 0.18 * 0.2 + 0.59 * 0.8, // 0.508
    powerRank: 4, // Reversed from 7: higher is better
  },
  {
    id: "xai/grok-code-fast-1",
    name: "Grok Code Fast 1",
    provider: "xAI",
    inputPrice: 0.2,
    outputPrice: 1.5,
    combinedPrice: 0.2 * 0.2 + 1.5 * 0.8, // 1.24
    powerRank: 10, // Reversed from 1: higher is better (best)
  },
  {
    id: "openai/gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "OpenAI",
    inputPrice: 0.25,
    outputPrice: 2.0,
    combinedPrice: 0.25 * 0.2 + 2.0 * 0.8, // 1.65
    powerRank: 2, // Reversed from 9: higher is better (worst)
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    inputPrice: 0.3,
    outputPrice: 2.5,
    combinedPrice: 0.3 * 0.2 + 2.5 * 0.8, // 2.06
    powerRank: 8, // Reversed from 3: higher is better
  },
  {
    id: "openai/gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "OpenAI",
    inputPrice: 0.4,
    outputPrice: 1.6,
    combinedPrice: 0.4 * 0.2 + 1.6 * 0.8, // 1.36
    powerRank: 5, // Reversed from 6: higher is better
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o-mini",
    provider: "OpenAI",
    inputPrice: 0.6,
    outputPrice: 2.4,
    combinedPrice: 0.6 * 0.2 + 2.4 * 0.8, // 2.04
    powerRank: 6, // Reversed from 5: higher is better
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    inputPrice: 3.0,
    outputPrice: 15.0,
    combinedPrice: 3.0 * 0.2 + 15.0 * 0.8, // 12.6
    powerRank: 3, // Reversed from 8: higher is better
  },
  {
    id: "anthropic/claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    inputPrice: 3.0,
    outputPrice: 15.0,
    combinedPrice: 3.0 * 0.2 + 15.0 * 0.8, // 12.6
    powerRank: 9, // Reversed from 2: higher is better (second best)
  },
];

/**
 * Default AI model used when user has no preference set.
 */
export const DEFAULT_AI_MODEL = "openai/gpt-4.1-nano";

/**
 * Gets an AI model by its OpenRouter identifier.
 * @param modelId - The OpenRouter model identifier
 * @returns The AI model or undefined if not found
 */
export function getModelById(modelId: string): AiModel | undefined {
  return AVAILABLE_AI_MODELS.find((model) => model.id === modelId);
}

/**
 * Validates if a model ID exists in the available models list.
 * @param modelId - The OpenRouter model identifier to validate
 * @returns True if the model exists, false otherwise
 */
export function isValidModelId(modelId: string): boolean {
  return AVAILABLE_AI_MODELS.some((model) => model.id === modelId);
}

