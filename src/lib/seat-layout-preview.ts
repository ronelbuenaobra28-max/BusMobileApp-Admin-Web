import type { SeatingLayout } from "@/types";

/**
 * Seating-layout preview helpers for the Admin Web bus form.
 *
 * IMPORTANT: this is a *display aid only*. The backend
 * (`app/services/seat_layout.py`) is the single source of truth for the seats
 * that actually exist on a trip; the passenger seat-selection screen and the
 * driver seat viewer both render the backend-generated positions returned by
 * `GET /api/trips/{id}/seats`. Nothing here is used to create or validate
 * bookings -- it exists so an admin can sanity-check a bus's layout while
 * filling in the form.
 */

/**
 * Stored layout for a bus whose physical arrangement has not been confirmed.
 * Displayed distinctly so an admin never mistakes it for a configured layout.
 */
export const LEGACY_LAYOUT = "legacy" as const;

export type SeatLayoutPreview = {
  layout: SeatingLayout | typeof LEGACY_LAYOUT;
  seatsPerRow: number;
  fullRows: number;
  finalRowSeats: number;
  totalRows: number;
  totalSeats: number;
  /** Row arrangements, e.g. [4, 4, 3] for a 43-seat 2+2 bus. */
  rows: number[];
  /** Seats rendered left of the aisle for each row (rows[i] -> leftSeats[i]). */
  leftSeats: number[];
  valid: boolean;
};

const SEATS_PER_ROW: Record<SeatingLayout, number> = {
  "2+2": 4,
  "2+3": 5,
};

/** Rear-row packing, mirroring the backend exactly. */
const REAR_ROW_SEATS: Record<number, number> = {
  4: 5, // 2+2, remainder 1 -> 5-seat rear row (2+3)
  5: 6, // 2+3, remainder 1 -> 6-seat rear row (3+3)
};

/**
 * Mirror of the backend seat generator, used purely to preview row
 * arrangement. See the note at the top of this file.
 */
function buildRows(capacity: number, layout: SeatingLayout | typeof LEGACY_LAYOUT): number[] {
  if (capacity < 1) return [];

  if (layout === LEGACY_LAYOUT) {
    const remainder = capacity % 4;
    if (remainder === 0) return repeat(capacity / 4, 4);
    if (remainder === 1) {
      // Mirrors the backend's "park five seats on the final row" rule.
      if (capacity >= 5) return [...repeat((capacity - 5) / 4, 4), 5];
      return [1];
    }
    return [...repeat(Math.floor(capacity / 4), 4), remainder];
  }

  const perRow = SEATS_PER_ROW[layout];
  let full = Math.floor(capacity / perRow);
  const remainder = capacity % perRow;

  if (remainder === 1) {
    const packed = REAR_ROW_SEATS[perRow] ?? perRow + 1;
    if (capacity >= packed) {
      full = Math.floor((capacity - packed) / perRow);
      return [...repeat(full, perRow), packed];
    }
    return repeat(0, perRow).concat([capacity]);
  }

  return [...repeat(full, perRow), ...(remainder > 0 ? [remainder] : [])];
}

/** Seats left of the aisle for a row of [count] seats (mirrors the mobile renderer). */
function leftSeatsForRow(count: number): number {
  if (count <= 0) return 0;
  return Math.floor(count / 2);
}

function repeat(count: number, value: number): number[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, () => value);
}

export function getSeatLayoutPreview(
  capacity: number,
  layout: SeatingLayout | typeof LEGACY_LAYOUT | null | undefined,
): SeatLayoutPreview {
  const resolved: SeatingLayout | typeof LEGACY_LAYOUT =
    layout === LEGACY_LAYOUT ? LEGACY_LAYOUT : (layout ?? "2+2");
  const seatsPerRow = resolved === LEGACY_LAYOUT ? 4 : SEATS_PER_ROW[resolved];
  const rows = buildRows(capacity, resolved);
  const finalRowSeats = rows.length > 0 ? rows[rows.length - 1] : 0;

  return {
    layout: resolved,
    seatsPerRow,
    fullRows: rows.length > 0 && finalRowSeats === seatsPerRow ? rows.length : rows.length - 1,
    finalRowSeats: finalRowSeats === seatsPerRow ? 0 : finalRowSeats,
    totalRows: rows.length,
    totalSeats: rows.reduce((sum, n) => sum + n, 0),
    rows,
    leftSeats: rows.map(leftSeatsForRow),
    valid: capacity > 0 && rows.reduce((sum, n) => sum + n, 0) === capacity,
  };
}

/** Human-readable summary of the preview, e.g. "11 rows of 4 + 1 seat". */
export function formatSeatLayoutPreview(preview: SeatLayoutPreview): string {
  if (preview.rows.length === 0) return "Enter a capacity to preview the layout.";

  const parts: string[] = [];
  if (preview.fullRows > 0) {
    parts.push(
      `${preview.fullRows} ${preview.fullRows === 1 ? "row" : "rows"} of ${preview.seatsPerRow}`,
    );
  }
  if (preview.finalRowSeats > 0) {
    parts.push(
      `+ ${preview.finalRowSeats} ${preview.finalRowSeats === 1 ? "seat" : "seats"} on the last row`,
    );
  }
  return parts.join(" ");
}
