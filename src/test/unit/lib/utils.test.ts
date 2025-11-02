import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4');
  });

  it('should handle conditional classes', () => {
    const result = cn('base-class', true && 'conditional-class');
    expect(result).toBe('base-class conditional-class');
  });

  it('should filter out falsy values', () => {
    const result = cn('base', false && 'hidden', null, undefined);
    expect(result).toBe('base');
  });
});

