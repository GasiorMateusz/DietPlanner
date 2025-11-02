import { describe, it, expect } from 'vitest';
import { validateChatMessage } from '@/lib/utils/chat-helpers';

describe('validateChatMessage', () => {
  const MAX_LENGTH = 5000;

  describe('empty and whitespace-only input', () => {
    it('should reject empty string', () => {
      const result = validateChatMessage('', MAX_LENGTH);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Message cannot be empty.');
    });

    it('should reject whitespace-only string', () => {
      const result = validateChatMessage('   ', MAX_LENGTH);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Message cannot be empty.');
    });

    it('should reject string with only newlines', () => {
      const result = validateChatMessage('\n\n\n', MAX_LENGTH);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Message cannot be empty.');
    });

    it('should reject string with only tabs', () => {
      const result = validateChatMessage('\t\t\t', MAX_LENGTH);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Message cannot be empty.');
    });

    it('should reject string with mixed whitespace', () => {
      const result = validateChatMessage(' \n\t \r\n ', MAX_LENGTH);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Message cannot be empty.');
    });
  });

  describe('message length validation', () => {
    it('should accept message exactly at MAX_LENGTH', () => {
      const message = 'a'.repeat(MAX_LENGTH);
      const result = validateChatMessage(message, MAX_LENGTH);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept message one character below MAX_LENGTH', () => {
      const message = 'a'.repeat(MAX_LENGTH - 1);
      const result = validateChatMessage(message, MAX_LENGTH);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject message exceeding MAX_LENGTH', () => {
      const message = 'a'.repeat(MAX_LENGTH + 1);
      const result = validateChatMessage(message, MAX_LENGTH);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Message too long. Please shorten your message.');
    });

    it('should reject message significantly exceeding MAX_LENGTH', () => {
      const message = 'a'.repeat(MAX_LENGTH * 2);
      const result = validateChatMessage(message, MAX_LENGTH);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Message too long. Please shorten your message.');
    });

    it('should count length after trimming', () => {
      const message = '   ' + 'a'.repeat(MAX_LENGTH) + '   ';
      const result = validateChatMessage(message, MAX_LENGTH);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject if trimmed length exceeds MAX_LENGTH', () => {
      const message = '   ' + 'a'.repeat(MAX_LENGTH) + 'a   ';
      const result = validateChatMessage(message, MAX_LENGTH);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Message too long. Please shorten your message.');
    });
  });

  describe('valid messages', () => {
    it('should accept short message', () => {
      const result = validateChatMessage('Hello', MAX_LENGTH);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept message with trimmed whitespace', () => {
      const result = validateChatMessage('  Hello world  ', MAX_LENGTH);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept multiline message', () => {
      const message = 'Line 1\nLine 2\nLine 3';
      const result = validateChatMessage(message, MAX_LENGTH);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept message with special characters', () => {
      const message = 'Hello! @#$%^&*()_+-=[]{}|;:,.<>?';
      const result = validateChatMessage(message, MAX_LENGTH);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept message with unicode characters', () => {
      const message = 'Hello 你好 مرحبا 🌍';
      const result = validateChatMessage(message, MAX_LENGTH);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept message with emojis', () => {
      const message = 'Hello 👋 World 🌍 😊';
      const result = validateChatMessage(message, MAX_LENGTH);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept single character message', () => {
      const result = validateChatMessage('a', MAX_LENGTH);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('custom max length', () => {
    it('should validate with custom max length', () => {
      const customMax = 100;
      const shortMessage = 'a'.repeat(50);
      const longMessage = 'a'.repeat(101);

      expect(validateChatMessage(shortMessage, customMax).valid).toBe(true);
      expect(validateChatMessage(longMessage, customMax).valid).toBe(false);
    });

    it('should handle very small max length', () => {
      const smallMax = 5;
      const shortMessage = '1234';
      const longMessage = '123456';

      expect(validateChatMessage(shortMessage, smallMax).valid).toBe(true);
      expect(validateChatMessage(longMessage, smallMax).valid).toBe(false);
    });

    it('should handle zero max length', () => {
      const result = validateChatMessage('a', 0);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Message too long. Please shorten your message.');
    });
  });
});


