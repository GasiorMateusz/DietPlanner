import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { FormProvider, type UseFormReturn, type FieldValues } from "react-hook-form";

/**
 * Renders a component wrapped with React Hook Form's FormProvider.
 * Useful for testing components that use form hooks like useFormContext.
 *
 * @example
 * ```tsx
 * const form = useForm({ defaultValues: { email: "" } });
 * renderWithForm(<MyComponent />, form);
 * ```
 *
 * @param component - The component to render
 * @param form - The form instance from useForm
 * @param options - Additional render options
 */
export function renderWithForm<T extends FieldValues>(
  component: React.ReactElement,
  form: UseFormReturn<T>,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(<FormProvider {...form}>{component}</FormProvider>, options);
}

/**
 * Helper to wait for form validation to complete.
 * Useful when testing form validation that happens asynchronously.
 *
 * @param callback - Function that triggers validation
 * @param timeout - Maximum time to wait (default: 1000ms)
 */
export async function waitForFormValidation(callback: () => void): Promise<void> {
  callback();
  await new Promise((resolve) => setTimeout(resolve, 100));
}
