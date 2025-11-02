import { describe, it, expect } from 'vitest';
import { render, screen } from '../../utils/test-utils';
import { MessageItem } from '@/components/MessageItem';
import type { ChatMessage } from '@/types';

describe('MessageItem', () => {
  describe('user messages', () => {
    it('should render user message correctly', () => {
      const message: ChatMessage = {
        role: 'user',
        content: 'Hello, this is a user message',
      };

      render(<MessageItem message={message} />);

      const messageElement = screen.getByText('Hello, this is a user message');
      expect(messageElement).toBeInTheDocument();
    });

    it('should render user message with special characters', () => {
      const message: ChatMessage = {
        role: 'user',
        content: 'User message with @#$%^&*() special chars!',
      };

      render(<MessageItem message={message} />);

      const messageElement = screen.getByText('User message with @#$%^&*() special chars!');
      expect(messageElement).toBeInTheDocument();
    });

    it('should render multiline user message', () => {
      const message: ChatMessage = {
        role: 'user',
        content: 'Line 1\nLine 2\nLine 3',
      };

      render(<MessageItem message={message} />);

      const messageElement = screen.getByText(/Line 1/);
      expect(messageElement).toBeInTheDocument();
    });
  });

  describe('assistant messages', () => {
    it('should render assistant message correctly', () => {
      const message: ChatMessage = {
        role: 'assistant',
        content: 'This is an assistant response',
      };

      render(<MessageItem message={message} />);

      const messageElement = screen.getByText('This is an assistant response');
      expect(messageElement).toBeInTheDocument();
    });

    it('should extract and display comments when present', () => {
      const message: ChatMessage = {
        role: 'assistant',
        content: `
          <meal_plan>
            <meals>...</meals>
          </meal_plan>
          <comments>This is an important comment about the meal plan</comments>
        `,
      };

      render(<MessageItem message={message} />);

      const commentElement = screen.getByText('This is an important comment about the meal plan');
      expect(commentElement).toBeInTheDocument();
    });

    it('should display cleaned content when no comments are present', () => {
      const message: ChatMessage = {
        role: 'assistant',
        content: `
          Some introductory text
          <meal_plan>
            <meals>...</meals>
          </meal_plan>
          Some closing text
        `,
      };

      render(<MessageItem message={message} />);

      // The meal_plan tags should be removed
      const content = screen.getByRole('paragraph');
      expect(content.textContent).toContain('Some introductory text');
      expect(content.textContent).toContain('Some closing text');
      expect(content.textContent).not.toContain('<meal_plan>');
    });

    it('should display fallback message when content is empty after cleaning', () => {
      const message: ChatMessage = {
        role: 'assistant',
        content: '<meal_plan><meals>...</meals></meal_plan>',
      };

      render(<MessageItem message={message} />);

      const fallbackElement = screen.getByText('Meal plan updated above.');
      expect(fallbackElement).toBeInTheDocument();
    });

    it('should prioritize comments over cleaned content', () => {
      const message: ChatMessage = {
        role: 'assistant',
        content: `
          <meal_plan>
            <meals>...</meals>
          </meal_plan>
          <comments>This comment should be shown</comments>
          Some other text that should not be shown
        `,
      };

      render(<MessageItem message={message} />);

      const commentElement = screen.getByText('This comment should be shown');
      expect(commentElement).toBeInTheDocument();
    });

    it('should handle multiline comments', () => {
      const message: ChatMessage = {
        role: 'assistant',
        content: `
          <comments>Line 1 comment
Line 2 comment
Line 3 comment</comments>
        `,
      };

      render(<MessageItem message={message} />);

      const commentElement = screen.getByText(/Line 1 comment/);
      expect(commentElement).toBeInTheDocument();
    });

    it('should handle case-insensitive comments tag', () => {
      const message: ChatMessage = {
        role: 'assistant',
        content: '<COMMENTS>Uppercase comments tag</COMMENTS>',
      };

      render(<MessageItem message={message} />);

      const commentElement = screen.getByText('Uppercase comments tag');
      expect(commentElement).toBeInTheDocument();
    });

    it('should display cleaned content when comments tag is empty', () => {
      const message: ChatMessage = {
        role: 'assistant',
        content: `
          <comments></comments>
          Some actual content here
        `,
      };

      render(<MessageItem message={message} />);

      // Empty comments should fall back to cleaned content
      const content = screen.getByRole('paragraph');
      expect(content.textContent).toContain('Some actual content here');
    });
  });

  describe('edge cases', () => {
    it('should handle empty user message', () => {
      const message: ChatMessage = {
        role: 'user',
        content: '',
      };

      render(<MessageItem message={message} />);

      const container = screen.getByRole('paragraph');
      expect(container).toBeInTheDocument();
      expect(container.textContent).toBe('');
    });

    it('should handle empty assistant message', () => {
      const message: ChatMessage = {
        role: 'assistant',
        content: '',
      };

      render(<MessageItem message={message} />);

      const fallbackElement = screen.getByText('Meal plan updated above.');
      expect(fallbackElement).toBeInTheDocument();
    });

    it('should handle very long message content', () => {
      const longContent = 'a'.repeat(1000);
      const message: ChatMessage = {
        role: 'user',
        content: longContent,
      };

      render(<MessageItem message={message} />);

      const messageElement = screen.getByText(longContent);
      expect(messageElement).toBeInTheDocument();
    });

    it('should handle message with XML-like content that is not actual XML', () => {
      const message: ChatMessage = {
        role: 'assistant',
        content: 'This is not <really> XML, it is just text with angle brackets',
      };

      render(<MessageItem message={message} />);

      // removeXmlTags removes angle brackets, so <really> becomes empty
      const messageElement = screen.getByRole('paragraph');
      expect(messageElement.textContent).toContain('This is not');
      expect(messageElement.textContent).toContain('XML, it is just text with angle brackets');
    });
  });
});


