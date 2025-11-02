import { describe, it, expect } from 'vitest';
import { createStateBridge } from '@/lib/utils/chat-helpers';
import type {
  ChatMessage,
  AssistantChatMessage,
  UserChatMessage,
  MealPlanStartupData,
} from '@/types';

describe('createStateBridge', () => {
  const mockStartupData: MealPlanStartupData = {
    patient_age: 30,
    patient_weight: 70,
    patient_height: 175,
    activity_level: 'moderate',
    target_kcal: 2000,
    target_macro_distribution: {
      p_perc: 30,
      f_perc: 25,
      c_perc: 45,
    },
    meal_names: ['Breakfast', 'Lunch', 'Dinner'],
    exclusions_guidelines: 'No nuts',
  };

  describe('valid data with all fields', () => {
    it('should create state bridge with all fields', () => {
      const messageHistory: ChatMessage[] = [
        { role: 'user', content: 'Create a meal plan' },
        {
          role: 'assistant',
          content: 'Here is your meal plan: <meals>...</meals>',
        },
      ];

      const result = createStateBridge('session-123', messageHistory, mockStartupData);

      expect(result).not.toBeNull();
      expect(result?.sessionId).toBe('session-123');
      expect(result?.lastAssistantMessage).toBe('Here is your meal plan: <meals>...</meals>');
      expect(result?.startupData).toEqual(mockStartupData);
    });

    it('should use the last assistant message when multiple exist', () => {
      const messageHistory: ChatMessage[] = [
        { role: 'user', content: 'First question' },
        { role: 'assistant', content: 'First response' },
        { role: 'user', content: 'Second question' },
        { role: 'assistant', content: 'Second response' },
        { role: 'user', content: 'Third question' },
        { role: 'assistant', content: 'Third response (final)' },
      ];

      const result = createStateBridge('session-456', messageHistory, mockStartupData);

      expect(result).not.toBeNull();
      expect(result?.lastAssistantMessage).toBe('Third response (final)');
    });
  });

  describe('missing startupData', () => {
    it('should create state bridge with undefined startupData when null is provided', () => {
      const messageHistory: ChatMessage[] = [
        {
          role: 'assistant',
          content: 'Meal plan content',
        },
      ];

      const result = createStateBridge('session-789', messageHistory, null);

      expect(result).not.toBeNull();
      expect(result?.startupData).toBeUndefined();
    });

    it('should create state bridge with undefined startupData when undefined is provided', () => {
      const messageHistory: ChatMessage[] = [
        {
          role: 'assistant',
          content: 'Meal plan content',
        },
      ];

      const result = createStateBridge('session-789', messageHistory, undefined);

      expect(result).not.toBeNull();
      expect(result?.startupData).toBeUndefined();
    });

    it('should create state bridge with undefined startupData when not provided', () => {
      const messageHistory: ChatMessage[] = [
        {
          role: 'assistant',
          content: 'Meal plan content',
        },
      ];

      const result = createStateBridge('session-789', messageHistory);

      expect(result).not.toBeNull();
      expect(result?.startupData).toBeUndefined();
    });
  });

  describe('no assistant messages', () => {
    it('should return null when no assistant messages exist', () => {
      const messageHistory: ChatMessage[] = [
        { role: 'user', content: 'Question 1' },
        { role: 'user', content: 'Question 2' },
      ];

      const result = createStateBridge('session-123', messageHistory, mockStartupData);

      expect(result).toBeNull();
    });

    it('should return null when message history is empty', () => {
      const messageHistory: ChatMessage[] = [];

      const result = createStateBridge('session-123', messageHistory, mockStartupData);

      expect(result).toBeNull();
    });

    it('should return null when only user messages exist', () => {
      const messageHistory: ChatMessage[] = [{ role: 'user', content: 'Only user message' }];

      const result = createStateBridge('session-123', messageHistory, mockStartupData);

      expect(result).toBeNull();
    });
  });

  describe('empty message history', () => {
    it('should return null for empty array', () => {
      const result = createStateBridge('session-123', [], mockStartupData);

      expect(result).toBeNull();
    });
  });

  describe('session ID handling', () => {
    it('should preserve session ID exactly as provided', () => {
      const messageHistory: ChatMessage[] = [
        { role: 'assistant', content: 'Message content' },
      ];

      const sessionId = 'abc-123-xyz';
      const result = createStateBridge(sessionId, messageHistory, mockStartupData);

      expect(result?.sessionId).toBe(sessionId);
    });

    it('should handle empty session ID', () => {
      const messageHistory: ChatMessage[] = [
        { role: 'assistant', content: 'Message content' },
      ];

      const result = createStateBridge('', messageHistory, mockStartupData);

      expect(result?.sessionId).toBe('');
    });

    it('should handle UUID format session ID', () => {
      const messageHistory: ChatMessage[] = [
        { role: 'assistant', content: 'Message content' },
      ];

      const sessionId = '550e8400-e29b-41d4-a716-446655440000';
      const result = createStateBridge(sessionId, messageHistory, mockStartupData);

      expect(result?.sessionId).toBe(sessionId);
    });
  });

  describe('message content handling', () => {
    it('should preserve full assistant message content', () => {
      const longContent = `
        <daily_summary>
          <kcal>2000</kcal>
          <proteins>150</proteins>
          <fats>65</fats>
          <carbs>250</carbs>
        </daily_summary>
        <meals>
          <meal>
            <name>Breakfast</name>
            <ingredients>Eggs, toast</ingredients>
            <preparation>Cook eggs</preparation>
            <summary>
              <kcal>500</kcal>
              <protein>30</protein>
              <fat>20</fat>
              <carb>50</carb>
            </summary>
          </meal>
        </meals>
        <comments>This is a comment</comments>
      `;

      const messageHistory: ChatMessage[] = [
        { role: 'assistant', content: longContent },
      ];

      const result = createStateBridge('session-123', messageHistory, mockStartupData);

      expect(result?.lastAssistantMessage).toBe(longContent);
    });

    it('should handle multiline message content', () => {
      const multilineContent = 'Line 1\nLine 2\nLine 3';

      const messageHistory: ChatMessage[] = [
        { role: 'assistant', content: multilineContent },
      ];

      const result = createStateBridge('session-123', messageHistory, mockStartupData);

      expect(result?.lastAssistantMessage).toBe(multilineContent);
    });

    it('should handle special characters in message content', () => {
      const specialContent = 'Message with special chars: @#$%^&*()_+-=[]{}|;:,.<>?';

      const messageHistory: ChatMessage[] = [
        { role: 'assistant', content: specialContent },
      ];

      const result = createStateBridge('session-123', messageHistory, mockStartupData);

      expect(result?.lastAssistantMessage).toBe(specialContent);
    });

    it('should handle empty message content', () => {
      const messageHistory: ChatMessage[] = [{ role: 'assistant', content: '' }];

      const result = createStateBridge('session-123', messageHistory, mockStartupData);

      expect(result?.lastAssistantMessage).toBe('');
    });
  });

  describe('complex message history', () => {
    it('should handle alternating messages and extract last assistant message', () => {
      const messageHistory: ChatMessage[] = [
        { role: 'user', content: 'Q1' },
        { role: 'assistant', content: 'A1' },
        { role: 'user', content: 'Q2' },
        { role: 'assistant', content: 'A2' },
        { role: 'user', content: 'Q3' },
        { role: 'assistant', content: 'A3 (last)' },
        { role: 'user', content: 'Q4' },
      ];

      const result = createStateBridge('session-123', messageHistory, mockStartupData);

      expect(result).not.toBeNull();
      expect(result?.lastAssistantMessage).toBe('A3 (last)');
    });

    it('should handle multiple consecutive assistant messages', () => {
      const messageHistory: ChatMessage[] = [
        { role: 'assistant', content: 'First assistant message' },
        { role: 'assistant', content: 'Second assistant message' },
        { role: 'assistant', content: 'Third assistant message (last)' },
      ];

      const result = createStateBridge('session-123', messageHistory, mockStartupData);

      expect(result).not.toBeNull();
      expect(result?.lastAssistantMessage).toBe('Third assistant message (last)');
    });
  });
});


