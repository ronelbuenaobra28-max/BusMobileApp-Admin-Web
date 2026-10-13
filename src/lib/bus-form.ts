import type { SeatingLayout } from "@/types";

/**
 * Pure helpers for the Admin Web bus form's seating-layout handling.
 *
 * Kept free of React so the important rules -- default layout, legacy
 * preservation, and 409 conflict handling -- can be tested directly.
 */

/** Stored layout for a bus whose physical arrangement is not yet confirmed. */
export const LEGACY_LAYOUT = "legacy" as const;

export type BusLayoutValue = SeatingLayout | typeof LEGACY_LAYOUT;

/** Every value the bus selector can hold. */
export const LAYOUT_OPTIONS: { value: BusLayoutValue; label: string; description: string }[] = [
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
  {
    value: LEGACY_LAYOUT,
    label: "Legacy (not configured)",
    description: "Keep the historical seat numbering until the physical layout is confirmed",
  },
];

/** The layout a newly created bus defaults to. */
export const DEFAULT_NEW_BUS_LAYOUT: SeatingLayout = "2+2";

/**
 * Maps a stored `seating_layout` to a value the selector understands.
 *
 * Buses created before the column existed report `null`; those must behave
 * exactly like `legacy` so their seat numbering is never disturbed.
 */
export function normalizeStoredLayout(value: string | null | undefined): BusLayoutValue {
  if (value === "2+2" || value === "2+3") return value;
  return LEGACY_LAYOUT;
}

/**
 * The options to show for a bus being edited.
 *
 * `legacy` is only offered when the bus already stores it, so a configured bus
 * can never be silently switched to the legacy fallback.
 */
export function availableLayoutOptions(current: BusLayoutValue): typeof LAYOUT_OPTIONS {
  return LAYOUT_OPTIONS.filter(
    (option) => option.value !== LEGACY_LAYOUT || current === LEGACY_LAYOUT,
  );
}

export function describeLayout(value: BusLayoutValue): string {
  return (
    LAYOUT_OPTIONS.find((option) => option.value === value)?.description ??
    "Choose how seats are arranged on this bus."
  );
}

export type BusFormValues = {
  bus_number: string;
  capacity: string;
  status: string;
  operator_id: string;
  seating_layout: BusLayoutValue;
};

export type BusPayload = {
  bus_number: string;
  capacity: number;
  status: string;
  operator_id: string | null;
  seating_layout?: SeatingLayout;
};

/**
 * Builds the create/update request body for the bus form.
 *
 * `seating_layout` is included only when it actually differs from what the bus
 * currently stores. Omitting it for an unchanged value is what keeps an
 * existing `legacy` bus on the legacy algorithm instead of silently converting
 * it to 2+2. `legacy` is never sent as an explicit value -- it is represented
 * by omission.
 */
export function buildBusPayload(
  form: BusFormValues,
  editing: { seating_layout?: string | null } | null,
): BusPayload {
  const initial = editing ? normalizeStoredLayout(editing.seating_layout) : DEFAULT_NEW_BUS_LAYOUT;
  const unchanged = !!editing && form.seating_layout === initial;

  const payload: BusPayload = {
    bus_number: form.bus_number.trim(),
    capacity: Number(form.capacity),
    status: form.status,
    operator_id: form.operator_id || null,
  };

  if (!unchanged) {
    payload.seating_layout =
      form.seating_layout === LEGACY_LAYOUT ? DEFAULT_NEW_BUS_LAYOUT : form.seating_layout;
  }

  return payload;
}

/** True when a rejected save was blocked because bookings depend on the layout. */
export function isBusConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: number }).status === 409
  );
}

/** Best-effort extraction of the backend's human-readable conflict reason. */
export function conflictMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "This change is not allowed right now.";
}
