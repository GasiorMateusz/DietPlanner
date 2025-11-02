import { describe, it, expect } from "vitest";

describe("Utility Functions", () => {
  it("should pass basic math test", () => {
    expect(2 + 2).toBe(4);
  });

  it("should handle string concatenation", () => {
    expect("hello" + " world").toBe("hello world");
  });
});
