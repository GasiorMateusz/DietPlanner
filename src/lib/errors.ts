/**
 * Custom error class for resources that are not found.
 * Used when a meal plan with the provided ID doesn't exist or doesn't belong to the user.
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Custom error class for validation failures.
 * Used when request body or parameters fail validation.
 */
export class ValidationError extends Error {
  constructor(message: string, public details: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Custom error class for database operation failures.
 * Used when Supabase operations fail unexpectedly.
 */
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

