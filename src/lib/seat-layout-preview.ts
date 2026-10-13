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

export const SEATING_LAYOUTS: { value: SeatingLayout; label: string; description: string }[] = [
  {
    value: "2+2",
    label: "2 + 2",
    description: "Two seats left, two right (4 per row)",
  },
  {
    value: "2+3",
    label: "2 + 3",
    description: "Two seats left, three right (5 per row)",
  },
];

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
  valid: boolean;
};

const SEATS_PER_ROW: Record<SeatingLayout, number> = {
  "2+2": 4,
  "2+3": 5,
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
  const full = Math.floor(capacity / perRow);
  const remainder = capacity % perRow;
  const rows = repeat(full, perRow);
  if (remainder > 0) rows.push(remainder);
  return rows;
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
