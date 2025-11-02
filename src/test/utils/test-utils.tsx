import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { vi } from "vitest";

/**
 * Custom render function that wraps components with providers
 * Add any global providers here (e.g., ThemeProvider, Router, etc.)
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };

// Export commonly used testing utilities
export { vi };
export { default as userEvent } from "@testing-library/user-event";
