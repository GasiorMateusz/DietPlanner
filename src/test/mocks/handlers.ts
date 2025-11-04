import { http, HttpResponse } from "msw";

/**
 * MSW handlers for API mocking
 * Add your API mock handlers here
 */

export const handlers = [
  // Example: OpenRouter API mock
  http.post("https://openrouter.ai/api/v1/chat/completions", () => {
    return HttpResponse.json({
      id: "test-chat-completion-id",
      model: "test-model",
      created: Date.now(),
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Test response from mocked OpenRouter API",
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
    });
  }),

  // Add more handlers as needed
  // Example: Supabase API mock
  // http.get("http://localhost:54321/rest/v1/*", () => {
  //   return HttpResponse.json([]);
  // }),
];
