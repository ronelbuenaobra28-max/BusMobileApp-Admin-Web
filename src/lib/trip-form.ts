// Trip schedule form helpers. Trips run on Philippine time, so the
// datetime-local inputs are always read and written as Asia/Manila (UTC+8,
// no daylight saving) whatever the admin's own computer is set to.

const MANILA_OFFSET = "+08:00";

/** The server's limits (backend admin_crud.TripCreate). */
export const MAX_TRIP_FARE = 100_000;
export const MAX_TRIP_SEATS = 200;

/** Stored instant → "YYYY-MM-DDTHH:mm" in Manila, for a datetime-local input. */
export function manilaInputFromIso(iso: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** datetime-local value read as Manila time → ISO instant for the API. */
export function isoFromManilaInput(value: string): string {
  return new Date(`${value}:00${MANILA_OFFSET}`).toISOString();
}

export interface TripNumberErrors {
  price?: string;
  available_seats?: string;
}

/** Price and seat checks shared by the create and edit forms. */
export function checkTripNumbers(price: string, seats: string, capacity?: number): TripNumberErrors {
  const errors: TripNumberErrors = {};
  const fare = Number(price);
  if (price.trim() === "" || !Number.isFinite(fare) || fare < 0) {
    errors.price = "Enter a valid price.";
  } else if (fare > MAX_TRIP_FARE) {
    errors.price = `Price can't be more than ₱${MAX_TRIP_FARE.toLocaleString("en-US")}.`;
  }
  const count = Number(seats);
  const limit = capacity ?? MAX_TRIP_SEATS;
  if (seats.trim() === "" || !Number.isInteger(count) || count < 0) {
    errors.available_seats = "Enter a whole number of seats.";
  } else if (count > limit) {
    errors.available_seats = capacity
      ? `This bus has ${capacity} seats.`
      : `Seats can't be more than ${MAX_TRIP_SEATS}.`;
  }
  return errors;
}
