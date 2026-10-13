import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import BusesPage from "@/pages/BusesPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockBuses = [
  {
    id: "bus-1",
    bus_number: "HM-101",
    capacity: 55,
    status: "active",
    current_route_id: null,
    operator_id: null,
    seating_layout: "2+2",
  },
  {
    id: "bus-2",
    bus_number: "HM-102",
    capacity: 45,
    status: "active",
    current_route_id: null,
    operator_id: null,
    seating_layout: "legacy",
  },
];

vi.mock("@/lib/api-hooks", () => ({
  useBuses: () => ({
    data: mockBuses,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCreateBus: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateBus: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRetireBus: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteBus: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useBulkRetireBuses: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useBulkDeleteBuses: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useOperators: () => ({ data: [], isLoading: false, error: null, refetch: vi.fn() }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  );
}

describe("BusesPage seating layout UI", () => {
  it("defaults the create form to 2+2", async () => {
    renderWithProviders(<BusesPage />);
    await screen.findByText("HM-101");
    fireEvent.click(screen.getByRole("button", { name: /add bus/i }));
    expect(screen.getByLabelText(/seating layout/i).textContent).toContain("2 + 2");
  });

  it("shows a live seat preview inside the create dialog", async () => {
    renderWithProviders(<BusesPage />);
    await screen.findByText("HM-101");
    fireEvent.click(screen.getByRole("button", { name: /add bus/i }));
    fireEvent.change(screen.getByLabelText(/capacity/i), { target: { value: "55" } });

    expect(screen.getByTestId("preview-total").textContent).toBe("55");
    expect(screen.getByTestId("preview-summary").textContent).toContain("13 rows of 4");
    expect(screen.getByTestId("preview-rows").children.length).toBe(14);
  });

  it("shows a legacy explanation text in the create dialog", async () => {
    renderWithProviders(<BusesPage />);
    await screen.findByText("HM-101");
    fireEvent.click(screen.getByRole("button", { name: /add bus/i }));
    // The 2+2 layout description is rendered for the default selection.
    expect(screen.getByText(/Two seats left, two right/i)).toBeVisible();
  });
});
