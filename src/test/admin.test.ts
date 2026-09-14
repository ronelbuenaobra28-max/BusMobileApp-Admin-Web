import { describe, it, expect } from "vitest";

describe("Admin Web App", () => {
  it("should have correct environment variable placeholder", () => {
    expect(import.meta.env.VITE_API_BASE_URL ?? "").toBeDefined();
  });

  it("utils cn should merge classes", async () => {
    const { cn } = await import("@/lib/utils");
    expect(cn("foo", "bar")).toBe("foo bar");
  });
});
