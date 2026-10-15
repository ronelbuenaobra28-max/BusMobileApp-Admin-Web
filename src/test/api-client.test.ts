import { describe, it, expect } from "vitest";
import { formatErrorDetail } from "@/lib/api-client";

describe("formatErrorDetail", () => {
  it("passes through a plain HTTPException message", () => {
    expect(formatErrorDetail("Trip not found")).toBe("Trip not found");
  });

  it("renders FastAPI 422 validation errors as readable text", () => {
    const detail = [
      { loc: ["body", "capacity"], msg: "Input should be greater than or equal to 1", type: "greater_than_equal" },
      { loc: ["body", "bus_number"], msg: "Field required", type: "missing" },
    ];
    expect(formatErrorDetail(detail)).toBe(
      "capacity: Input should be greater than or equal to 1; bus_number: Field required",
    );
  });

  it("uses the nested message of a structured error", () => {
    expect(
      formatErrorDetail({ error: { code: "PAYMENT_GATEWAY_ERROR", message: "Unable to initialize online payment." } }),
    ).toBe("Unable to initialize online payment.");
  });

  it("returns undefined when there is no detail", () => {
    expect(formatErrorDetail(undefined)).toBeUndefined();
    expect(formatErrorDetail(null)).toBeUndefined();
  });
});
