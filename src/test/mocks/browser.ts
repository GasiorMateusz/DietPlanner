import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/**
 * MSW worker instance for browser environment (component tests with jsdom)
 */
export const worker = setupWorker(...handlers);

// Start the worker before tests run
worker.start({
  onUnhandledRequest: "bypass",
});
