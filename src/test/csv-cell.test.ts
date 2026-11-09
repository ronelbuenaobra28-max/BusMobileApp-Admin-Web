import { describe, it, expect } from "vitest";
import { csvCell } from "@/lib/format";

describe("CSV export cells", () => {
  it("defuses text a spreadsheet would run as a formula", () => {
    expect(csvCell('=HYPERLINK("http://x","Click")')).toBe(`"'=HYPERLINK(""http://x"",""Click"")"`);
    expect(csvCell("+63 Bus Lines")).toBe(`"'+63 Bus Lines"`);
    expect(csvCell("@SUM(A1)")).toBe(`"'@SUM(A1)"`);
    expect(csvCell("-cmd|' /C calc'!A0")).toBe(`"'-cmd|' /C calc'!A0"`);
  });

  it("leaves names and numbers as they are", () => {
    expect(csvCell("Victory Liner")).toBe(`"Victory Liner"`);
    expect(csvCell(1500)).toBe(`"1500"`);
    expect(csvCell(-5)).toBe(`"-5"`);
    expect(csvCell("-5.00")).toBe(`"-5.00"`);
    expect(csvCell("3000.00")).toBe(`"3000.00"`);
  });
});
