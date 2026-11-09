import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { checkTripNumbers, isoFromManilaInput, manilaInputFromIso } from "@/lib/trip-form";

describe("trip times are Philippine time", () => {
  it("round-trips a stored departure without moving it", () => {
    const stored = "2026-11-10T00:30:00+00:00"; // 8:30 AM in Manila
    const input = manilaInputFromIso(stored);
    expect(input).toBe("2026-11-10T08:30");
    expect(isoFromManilaInput(input)).toBe("2026-11-10T00:30:00.000Z");
  });

  it("crosses midnight correctly", () => {
    expect(manilaInputFromIso("2026-11-09T20:15:00Z")).toBe("2026-11-10T04:15");
  });
});

describe("trip price and seat checks", () => {
  it("rejects blank, negative and oversized values", () => {
    expect(checkTripNumbers("", "", 45)).toEqual({
      price: "Enter a valid price.",
      available_seats: "Enter a whole number of seats.",
    });
    expect(checkTripNumbers("-1", "2.5", 45).price).toBeDefined();
    expect(checkTripNumbers("-1", "2.5", 45).available_seats).toBeDefined();
    expect(checkTripNumbers("7500000", "40", 45).price).toMatch(/more than/);
    expect(checkTripNumbers("750", "46", 45).available_seats).toBe("This bus has 45 seats.");
  });

  it("accepts a normal trip", () => {
    expect(checkTripNumbers("750", "45", 45)).toEqual({});
    expect(checkTripNumbers("0", "0")).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// Edit form on the trip page
// ---------------------------------------------------------------------------
const updateTrip = vi.fn();
const trip = {
  id: "t1",
  route_id: "r1",
  bus_id: "b1",
  driver_id: "d1",
  scheduled_departure: "2026-11-10T00:30:00+00:00",
  status: "scheduled",
  price: 750,
  available_seats: 40,
};

vi.mock("@/lib/api-hooks", () => ({
  useTrip: () => ({ data: trip, isLoading: false, error: null, refetch: vi.fn() }),
  useUpdateTrip: () => ({ mutateAsync: updateTrip }),
  useCancelTrip: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRoutes: () => ({ data: [] }),
  useDrivers: () => ({ data: [] }),
  useBuses: () => ({ data: [{ id: "b1", capacity: 45 }] }),
}));

async function openEditor() {
  const { default: ScheduleDetailPage } = await import("@/pages/ScheduleDetailPage");
  render(
    <MemoryRouter initialEntries={["/schedules/t1"]}>
      <Routes>
        <Route path="/schedules/:id" element={<ScheduleDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: /^Edit$/ }));
}

beforeEach(() => {
  updateTrip.mockReset();
  updateTrip.mockResolvedValue({});
});

describe("trip edit form", () => {
  it("sends only the changed price, leaving the departure untouched", async () => {
    await openEditor();
    expect(screen.getByDisplayValue("2026-11-10T08:30")).toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue("750"), { target: { value: "800" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(updateTrip).toHaveBeenCalledWith({ id: "t1", body: { price: 800 } }));
  });

  it("blocks a blank price and too many seats", async () => {
    await openEditor();
    fireEvent.change(screen.getByDisplayValue("750"), { target: { value: "" } });
    fireEvent.change(screen.getByDisplayValue("40"), { target: { value: "60" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Enter a valid price.")).toBeInTheDocument();
    expect(screen.getByText("This bus has 45 seats.")).toBeInTheDocument();
    expect(updateTrip).not.toHaveBeenCalled();
  });

  it("does not offer Cancelled in the status list", async () => {
    await openEditor();
    expect(screen.queryByRole("option", { name: "Cancelled" })).not.toBeInTheDocument();
  });
});
