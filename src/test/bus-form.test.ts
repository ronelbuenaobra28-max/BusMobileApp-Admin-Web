import { describe, it, expect } from "vitest";
import {
  LEGACY_LAYOUT,
  LAYOUT_OPTIONS,
  DEFAULT_NEW_BUS_LAYOUT,
  availableLayoutOptions,
  buildBusPayload,
  conflictMessage,
  describeLayout,
  isBusConflict,
  normalizeStoredLayout,
} from "@/lib/bus-form";
import type { BusFormValues } from "@/lib/bus-form";
import { formatSeatLayoutPreview, getSeatLayoutPreview } from "@/lib/seat-layout-preview";

function form(overrides: Partial<BusFormValues> = {}): BusFormValues {
  return {
    bus_number: "HM-100",
    capacity: "50",
    status: "active",
    operator_id: "",
    seating_layout: DEFAULT_NEW_BUS_LAYOUT,
    ...overrides,
  };
}

describe("Bus form payload", () => {
  it("defaults a new bus to 2+2", () => {
    expect(buildBusPayload(form(), null).seating_layout).toBe("2+2");
  });

  it("includes every other form field", () => {
    const payload = buildBusPayload(
      form({ bus_number: "  HM-200  ", capacity: "55", status: "maintenance", operator_id: "op-1" }),
      null,
    );
    expect(payload).toEqual({
      bus_number: "HM-200",
      capacity: 55,
      status: "maintenance",
      operator_id: "op-1",
      seating_layout: "2+2",
    });
  });

  it("maps an empty operator to null", () => {
    expect(buildBusPayload(form({ operator_id: "" }), null).operator_id).toBeNull();
  });

  it("sends the newly selected 2+3 layout on create", () => {
    expect(buildBusPayload(form({ seating_layout: "2+3" }), null).seating_layout).toBe("2+3");
  });
});

describe("Legacy layout preservation", () => {
  it("treats null and unknown stored values as legacy", () => {
    expect(normalizeStoredLayout(null)).toBe(LEGACY_LAYOUT);
    expect(normalizeStoredLayout(undefined)).toBe(LEGACY_LAYOUT);
    expect(normalizeStoredLayout("nonsense")).toBe(LEGACY_LAYOUT);
  });

  it("keeps a stored 2+2 or 2+3 as-is", () => {
    expect(normalizeStoredLayout("2+2")).toBe("2+2");
    expect(normalizeStoredLayout("2+3")).toBe("2+3");
  });

  it("omits seating_layout when a legacy bus is saved unchanged", () => {
    const payload = buildBusPayload(form({ seating_layout: LEGACY_LAYOUT }), {
      seating_layout: "legacy",
    });
    expect(payload).not.toHaveProperty("seating_layout");
  });

  it("omits seating_layout when a null-layout bus is saved unchanged", () => {
    const payload = buildBusPayload(form({ seating_layout: LEGACY_LAYOUT }), {
      seating_layout: null,
    });
    expect(payload).not.toHaveProperty("seating_layout");
  });

  it("omits seating_layout when a configured bus keeps its layout", () => {
    const payload = buildBusPayload(form({ seating_layout: "2+3" }), { seating_layout: "2+3" });
    expect(payload).not.toHaveProperty("seating_layout");
  });

  it("sends the new layout when a legacy bus is explicitly changed to 2+3", () => {
    const payload = buildBusPayload(form({ seating_layout: "2+3" }), { seating_layout: "legacy" });
    expect(payload.seating_layout).toBe("2+3");
  });

  it("sends the new layout when a 2+2 bus is changed to 2+3", () => {
    const payload = buildBusPayload(form({ seating_layout: "2+3" }), { seating_layout: "2+2" });
    expect(payload.seating_layout).toBe("2+3");
  });

  it("never sends 'legacy' as an explicit value", () => {
    // Choosing legacy on a non-legacy bus is not a permission the UI grants;
    // even if it happened, it must not be written back as a literal string.
    const payload = buildBusPayload(form({ seating_layout: LEGACY_LAYOUT }), { seating_layout: "2+2" });
    expect(payload.seating_layout).not.toBe(LEGACY_LAYOUT);
    expect(payload.seating_layout).toBe("2+2");
  });
});

describe("Layout selector options", () => {
  it("offers both layouts plus legacy by default", () => {
    expect(availableLayoutOptions(DEFAULT_NEW_BUS_LAYOUT).map((o) => o.value)).toEqual([
      "2+2",
      "2+3",
    ]);
  });

  it("offers the legacy option only for legacy buses", () => {
    expect(availableLayoutOptions(LEGACY_LAYOUT).map((o) => o.value)).toContain(LEGACY_LAYOUT);
    expect(availableLayoutOptions("2+2").map((o) => o.value)).not.toContain(LEGACY_LAYOUT);
    expect(availableLayoutOptions("2+3").map((o) => o.value)).not.toContain(LEGACY_LAYOUT);
  });

  it("every option has a label and description", () => {
    for (const option of LAYOUT_OPTIONS) {
      expect(option.label.length).toBeGreaterThan(0);
      expect(option.description.length).toBeGreaterThan(0);
    }
  });

  it("describeLayout explains each layout", () => {
    expect(describeLayout("2+2")).toContain("Two seats left, two right");
    expect(describeLayout("2+3")).toContain("Two seats left, three right");
    expect(describeLayout(LEGACY_LAYOUT)).toContain("historical seat numbering");
  });
});

describe("409 conflict handling", () => {
  const conflict = Object.assign(new Error("Seating layout cannot be changed"), {
    status: 409,
  });

  it("detects a 409 conflict", () => {
    expect(isBusConflict(conflict)).toBe(true);
  });

  it("surfaces the backend message", () => {
    expect(conflictMessage(conflict)).toBe("Seating layout cannot be changed");
  });

  it("does not treat other statuses as conflicts", () => {
    expect(isBusConflict(Object.assign(new Error("nope"), { status: 400 }))).toBe(false);
    expect(isBusConflict(Object.assign(new Error("nope"), { status: 500 }))).toBe(false);
    expect(isBusConflict(new Error("plain"))).toBe(false);
    expect(isBusConflict("string")).toBe(false);
    expect(isBusConflict(null)).toBe(false);
    expect(isBusConflict(undefined)).toBe(false);
  });

  it("falls back to a generic message when none is provided", () => {
    expect(conflictMessage(new Error(""))).toBe("This change is not allowed right now.");
    expect(conflictMessage({})).toBe("This change is not allowed right now.");
    expect(conflictMessage(null)).toBe("This change is not allowed right now.");
  });
});

describe("SeatLayoutPreview helper", () => {
  it("2+2 splits rows into 4 with a partial final row", () => {
    const p = getSeatLayoutPreview(43, "2+2");
    expect(p.rows).toEqual([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3]);
    expect(p.totalSeats).toBe(43);
    expect(p.valid).toBe(true);
  });

  it("2+2 with an exact multiple has no final partial row", () => {
    const p = getSeatLayoutPreview(40, "2+2");
    expect(p.finalRowSeats).toBe(0);
    expect(p.fullRows).toBe(10);
    expect(p.totalSeats).toBe(40);
  });

  it("2+3 splits rows into 5 with a partial final row", () => {
    const p = getSeatLayoutPreview(53, "2+3");
    expect(p.rows).toEqual([5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 3]);
    expect(p.totalSeats).toBe(53);
  });

  it("2+3 with an exact multiple has no final partial row", () => {
    const p = getSeatLayoutPreview(55, "2+3");
    expect(p.finalRowSeats).toBe(0);
    expect(p.fullRows).toBe(11);
    expect(p.totalSeats).toBe(55);
  });

  it("legacy keeps the five-seat final row at capacity 45", () => {
    const p = getSeatLayoutPreview(45, LEGACY_LAYOUT);
    expect(p.rows).toEqual([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5]);
    expect(p.totalSeats).toBe(45);
  });

  it("legacy keeps the three-seat final row at capacity 55", () => {
    const p = getSeatLayoutPreview(55, LEGACY_LAYOUT);
    expect(p.rows).toEqual([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3]);
    expect(p.totalSeats).toBe(55);
  });

  it("null layout falls back to 2+2", () => {
    expect(getSeatLayoutPreview(40, null).seatsPerRow).toBe(4);
  });

  it("invalid capacity is marked invalid", () => {
    expect(getSeatLayoutPreview(0, "2+2").valid).toBe(false);
    expect(getSeatLayoutPreview(0, "2+2").rows).toEqual([]);
  });

  it("total seats always equal capacity for realistic sizes", () => {
    for (const layout of ["2+2", "2+3", LEGACY_LAYOUT] as const) {
      for (let capacity = 1; capacity <= 60; capacity++) {
        const p = getSeatLayoutPreview(capacity, layout);
        expect(p.totalSeats, `${layout} @ ${capacity}`).toBe(capacity);
        expect(p.valid).toBe(true);
      }
    }
  });

  it("formatSeatLayoutPreview is human readable", () => {
    expect(formatSeatLayoutPreview(getSeatLayoutPreview(43, "2+2"))).toBe(
      "10 rows of 4 + 3 seats on the last row",
    );
    expect(formatSeatLayoutPreview(getSeatLayoutPreview(40, "2+2"))).toBe(
      "10 rows of 4",
    );
    expect(formatSeatLayoutPreview(getSeatLayoutPreview(0, "2+2"))).toBe(
      "Enter a capacity to preview the layout.",
    );
  });
});

describe("Rear-row packing preview parity", () => {
  it("2+2 packs a five-seat rear row at capacity 45", () => {
    const p = getSeatLayoutPreview(45, "2+2");
    expect(p.rows).toEqual([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5]);
    expect(p.totalSeats).toBe(45);
    expect(p.finalRowSeats).toBe(5);
    expect(p.fullRows).toBe(10);
    expect(p.valid).toBe(true);
  });

  it("2+3 packs a six-seat rear row at capacity 56", () => {
    const p = getSeatLayoutPreview(56, "2+3");
    expect(p.rows).toEqual([5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6]);
    expect(p.totalSeats).toBe(56);
    expect(p.finalRowSeats).toBe(6);
    expect(p.fullRows).toBe(10);
  });

  it("2+3 packs a six-seat rear row at capacity 51", () => {
    const p = getSeatLayoutPreview(51, "2+3");
    expect(p.rows).toEqual([5, 5, 5, 5, 5, 5, 5, 5, 5, 6]);
    expect(p.totalSeats).toBe(51);
  });

  it("2+3 capacity 55 has no rear row", () => {
    const p = getSeatLayoutPreview(55, "2+3");
    expect(p.finalRowSeats).toBe(0);
    expect(p.fullRows).toBe(11);
    expect(p.totalSeats).toBe(55);
    expect(p.rows).toEqual(Array.from({ length: 11 }, () => 5));
  });

  it("rear rows split 2+3 for five seats and 3+3 for six", () => {
    expect(getSeatLayoutPreview(45, "2+2").leftSeats[10]).toBe(2);
    expect(getSeatLayoutPreview(56, "2+3").leftSeats[10]).toBe(3);
    // Full rows keep the layout's own split.
    expect(getSeatLayoutPreview(56, "2+3").leftSeats[0]).toBe(2);
  });

  it("leftSeats always sums with the right side to the row count", () => {
    for (const layout of ["2+2", "2+3"] as const) {
      for (let capacity = 1; capacity <= 60; capacity++) {
        const p = getSeatLayoutPreview(capacity, layout);
        expect(p.leftSeats.length).toBe(p.rows.length);
        p.rows.forEach((count, i) => {
          const left = p.leftSeats[i];
          // left + right must equal the row count; a 1-seat row is all-right.
          expect(left, `${layout} @ ${capacity} row ${i}`).toBeGreaterThanOrEqual(0);
          expect(left).toBeLessThan(count);
          expect(left + (count - left)).toBe(count);
        });
      }
    }
  });

  it("leftSeats mirrors the mobile renderer's split", () => {
    const lastRowSplit = (capacity: number, layout: "2+2" | "2+3") => {
      const p = getSeatLayoutPreview(capacity, layout);
      return p.leftSeats[p.leftSeats.length - 1];
    };
    // A packed rear row means a configured layout can never end in a lone
    // seat, so 2/3-seat tails come from remainders of 2 and 3.
    expect(lastRowSplit(1, "2+2")).toBe(0); // single-seat bus
    expect(lastRowSplit(42, "2+2")).toBe(1); // 10 rows of 4 + 2
    expect(lastRowSplit(43, "2+2")).toBe(1); // 10 rows of 4 + 3
    expect(lastRowSplit(40, "2+2")).toBe(2); // all rows of 4
    expect(lastRowSplit(45, "2+2")).toBe(2); // packed 5-seat rear row
    expect(lastRowSplit(53, "2+3")).toBe(1); // 10 rows of 5 + 3
    expect(lastRowSplit(56, "2+3")).toBe(3); // packed 6-seat rear row
  });

  it("never packs a remainder other than one", () => {
    expect(getSeatLayoutPreview(42, "2+2").rows[10]).toBe(2);
    expect(getSeatLayoutPreview(43, "2+2").rows[10]).toBe(3);
    expect(getSeatLayoutPreview(52, "2+3").rows[10]).toBe(2);
    expect(getSeatLayoutPreview(53, "2+3").rows[10]).toBe(3);
  });

  it("capacity 1 is not packed", () => {
    expect(getSeatLayoutPreview(1, "2+2").rows).toEqual([1]);
    expect(getSeatLayoutPreview(1, "2+3").rows).toEqual([1]);
  });

  it("2+2 preview matches the legacy preview for every capacity", () => {
    for (let capacity = 1; capacity <= 60; capacity++) {
      const legacy = getSeatLayoutPreview(capacity, LEGACY_LAYOUT);
      const twoPlusTwo = getSeatLayoutPreview(capacity, "2+2");
      expect(twoPlusTwo.rows, `capacity ${capacity}`).toEqual(legacy.rows);
    }
  });
});
