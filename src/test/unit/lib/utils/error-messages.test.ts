import { describe, it, expect, vi } from 'vitest';
import { getChatErrorMessage } from '@/lib/utils/chat-helpers';

describe('getChatErrorMessage', () => {
  describe('specific HTTP status codes', () => {
    it('should return "Unauthorized" for 401 status', async () => {
      const response = new Response(null, { status: 401 });
      const result = await getChatErrorMessage(response, 'Default error');

      expect(result).toBe('Unauthorized');
    });

    it('should return session not found message for 404 status', async () => {
      const response = new Response(null, { status: 404 });
      const result = await getChatErrorMessage(response, 'Default error');

      expect(result).toBe('Session not found. Please start a new meal plan from the dashboard.');
    });

    it('should return AI service unavailable message for 502 status', async () => {
      const response = new Response(null, { status: 502 });
      const result = await getChatErrorMessage(response, 'Default error');

      expect(result).toBe('AI service is temporarily unavailable. Please try again in a moment.');
    });

    it('should return internal error message for 500 status', async () => {
      const response = new Response(null, { status: 500 });
      const result = await getChatErrorMessage(response, 'Default error');

      expect(result).toBe('An internal error occurred. Please try again later.');
    });
  });

  describe('error response with JSON body', () => {
    it('should extract error from JSON body when available', async () => {
      const errorBody = { error: 'Custom error message from server' };
      const response = new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await getChatErrorMessage(response, 'Default error');

      expect(result).toBe('Custom error message from server');
    });

    it('should use default message if error field is missing in JSON', async () => {
      const errorBody = { message: 'Some other field' };
      const response = new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await getChatErrorMessage(response, 'Default error message');

      expect(result).toBe('Default error message');
    });

    it('should use default message if error field is empty string', async () => {
      const errorBody = { error: '' };
      const response = new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await getChatErrorMessage(response, 'Default error message');

      expect(result).toBe('Default error message');
    });

    it('should use default message if error field is null', async () => {
      const errorBody = { error: null };
      const response = new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await getChatErrorMessage(response, 'Default error message');

      expect(result).toBe('Default error message');
    });
  });

  describe('malformed JSON handling', () => {
    it('should return default message when JSON is malformed', async () => {
      const response = new Response('{ invalid json }', {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await getChatErrorMessage(response, 'Default error message');

      expect(result).toBe('Default error message');
    });

    it('should return default message when response body is empty', async () => {
      const response = new Response('', { status: 400 });

      const result = await getChatErrorMessage(response, 'Default error message');

      expect(result).toBe('Default error message');
    });

    it('should return default message when response body is not JSON', async () => {
      const response = new Response('Plain text error', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });

      const result = await getChatErrorMessage(response, 'Default error message');

      expect(result).toBe('Default error message');
    });
  });

  describe('other status codes', () => {
    it('should return default message for 400 Bad Request', async () => {
      const response = new Response(null, { status: 400 });
      const result = await getChatErrorMessage(response, 'Bad request error');

      expect(result).toBe('Bad request error');
    });

    it('should return default message for 403 Forbidden', async () => {
      const response = new Response(null, { status: 403 });
      const result = await getChatErrorMessage(response, 'Forbidden error');

      expect(result).toBe('Forbidden error');
    });

    it('should return default message for 429 Too Many Requests', async () => {
      const response = new Response(null, { status: 429 });
      const result = await getChatErrorMessage(response, 'Rate limit error');

      expect(result).toBe('Rate limit error');
    });

    it('should return default message for 503 Service Unavailable', async () => {
      const response = new Response(null, { status: 503 });
      const result = await getChatErrorMessage(response, 'Service unavailable');

      expect(result).toBe('Service unavailable');
    });

    it('should return default message for 200 OK (should not happen but handle gracefully)', async () => {
      const response = new Response(null, { status: 200 });
      const result = await getChatErrorMessage(response, 'Unexpected error');

      expect(result).toBe('Unexpected error');
    });
  });

  describe('response with both status code and JSON error', () => {
    it('should prioritize specific status code over JSON error', async () => {
      const errorBody = { error: 'JSON error message' };
      const response = new Response(JSON.stringify(errorBody), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await getChatErrorMessage(response, 'Default error');

      expect(result).toBe('Unauthorized');
    });

    it('should use JSON error for non-specific status codes', async () => {
      const errorBody = { error: 'Custom validation error' };
      const response = new Response(JSON.stringify(errorBody), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await getChatErrorMessage(response, 'Default error');

      expect(result).toBe('Custom validation error');
    });
  });

  describe('edge cases', () => {
    it('should handle response with multiple error fields in JSON', async () => {
      const errorBody = {
        error: 'Main error',
        errors: ['Error 1', 'Error 2'],
        message: 'Alternative message',
      };
      const response = new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await getChatErrorMessage(response, 'Default error');

      expect(result).toBe('Main error');
    });

    it('should handle error field with complex nested structure', async () => {
      const errorBody = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
        },
      };
      const response = new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });

      // Should stringify the object or use default
      const result = await getChatErrorMessage(response, 'Default error');
      // The function expects error to be a string, so it will likely use default
      expect(typeof result).toBe('string');
    });
  });
});


