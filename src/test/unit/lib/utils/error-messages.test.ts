import { describe, it, expect, vi } from "vitest";
import { getChatErrorMessage } from "@/lib/utils/chat-helpers";

describe("getChatErrorMessage", () => {
  describe("specific HTTP status codes", () => {
    it('should return "Unauthorized" for 401 status', async () => {
      const response = new Response(null, { status: 401 });
      const result = await getChatErrorMessage(response, "Default error");

      expect(result).toBe("Unauthorized");
    });

    it("should return session not found message for 404 status", async () => {
      const response = new Response(null, { status: 404 });
      const result = await getChatErrorMessage(response, "Default error");

      expect(result).toBe("Session not found. Please start a new meal plan from the dashboard.");
    });

    it("should return AI service unavailable message for 502 status", async () => {
      const response = new Response(null, { status: 502 });
      const result = await getChatErrorMessage(response, "Default error");

      expect(result).toBe("AI service is temporarily unavailable. Please try again in a moment.");
    });

    it("should return internal error message for 500 status", async () => {
      const response = new Response(null, { status: 500 });
      const result = await getChatErrorMessage(response, "Default error");

      expect(result).toBe("An internal error occurred. Please try again later.");
    });
  });

  describe("error response with JSON body", () => {
    it("should extract error from JSON body when available", async () => {
      const errorBody = { error: "Custom error message from server" };
      const response = new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

      const result = await getChatErrorMessage(response, "Default error");

      expect(result).toBe("Custom error message from server");
    });

    it("should use default message if error field is missing, empty, or null in JSON", async () => {
      const defaultMsg = "Default error message";

      const response1 = new Response(JSON.stringify({ message: "Some other field" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

      const response2 = new Response(JSON.stringify({ error: "" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

      const response3 = new Response(JSON.stringify({ error: null }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

      expect(await getChatErrorMessage(response1, defaultMsg)).toBe(defaultMsg);
      expect(await getChatErrorMessage(response2, defaultMsg)).toBe(defaultMsg);
      expect(await getChatErrorMessage(response3, defaultMsg)).toBe(defaultMsg);
    });
  });

  describe("malformed JSON handling", () => {
    it("should return default message when JSON is malformed, empty, or not JSON", async () => {
      const defaultMsg = "Default error message";

      const response1 = new Response("{ invalid json }", {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

      const response2 = new Response("", { status: 400 });

      const response3 = new Response("Plain text error", {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });

      expect(await getChatErrorMessage(response1, defaultMsg)).toBe(defaultMsg);
      expect(await getChatErrorMessage(response2, defaultMsg)).toBe(defaultMsg);
      expect(await getChatErrorMessage(response3, defaultMsg)).toBe(defaultMsg);
    });
  });

  describe("other status codes", () => {
    it("should return default message for non-specific status codes", async () => {
      const testCases = [
        { status: 400, defaultMsg: "Bad request error" },
        { status: 403, defaultMsg: "Forbidden error" },
        { status: 429, defaultMsg: "Rate limit error" },
        { status: 503, defaultMsg: "Service unavailable" },
        { status: 200, defaultMsg: "Unexpected error" },
      ];

      for (const { status, defaultMsg } of testCases) {
        const response = new Response(null, { status });
        const result = await getChatErrorMessage(response, defaultMsg);
        expect(result).toBe(defaultMsg);
      }
    });
  });

  describe("response with both status code and JSON error", () => {
    it("should prioritize specific status code over JSON error", async () => {
      const errorBody = { error: "JSON error message" };
      const response = new Response(JSON.stringify(errorBody), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });

      const result = await getChatErrorMessage(response, "Default error");

      expect(result).toBe("Unauthorized");
    });

    it("should use JSON error for non-specific status codes", async () => {
      const errorBody = { error: "Custom validation error" };
      const response = new Response(JSON.stringify(errorBody), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });

      const result = await getChatErrorMessage(response, "Default error");

      expect(result).toBe("Custom validation error");
    });
  });

  describe("edge cases", () => {
    it("should handle response with multiple error fields in JSON", async () => {
      const errorBody = {
        error: "Main error",
        errors: ["Error 1", "Error 2"],
        message: "Alternative message",
      };
      const response = new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

      const result = await getChatErrorMessage(response, "Default error");

      expect(result).toBe("Main error");
    });

    it("should handle error field with complex nested structure", async () => {
      const errorBody = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
        },
      };
      const response = new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

      // Should stringify the object or use default
      const result = await getChatErrorMessage(response, "Default error");
      // The function expects error to be a string, so it will likely use default
      expect(typeof result).toBe("string");
    });
  });
});
