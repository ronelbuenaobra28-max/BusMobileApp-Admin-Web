import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import OperatorsPage from "@/pages/OperatorsPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockOperators = [
  { id: "1", name: "Active Transit", active: "active" },
  { id: "2", name: "Inactive Lines", active: "inactive" },
];

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  );
}

vi.mock("@/lib/api-hooks", () => ({
  useOperators: () => ({
    data: mockOperators,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCreateOperator: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateOperator: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeactivateOperator: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("OperatorsPage action menu", () => {
  it("renders operator rows with action buttons", async () => {
    renderWithProviders(<OperatorsPage />);
    expect(await screen.findByText("Active Transit")).toBeVisible();
    expect(screen.getByText("Inactive Lines")).toBeVisible();
  });

  it("renders a three-dot action button for each operator row", async () => {
    renderWithProviders(<OperatorsPage />);
    await screen.findByText("Active Transit");

    const menuButtons = screen.getAllByRole("button", { name: "" });
    const actionButtons = menuButtons.filter((btn) =>
      btn.classList.contains("h-8"),
    );
    expect(actionButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("renders action menu items inside the dropdown for active operator", async () => {
    renderWithProviders(<OperatorsPage />);
    await screen.findByText("Active Transit");

    const activeRow = screen.getByText("Active Transit").closest("tr");
    const menuButton = activeRow?.querySelector('[aria-haspopup="menu"]') as HTMLElement;
    expect(menuButton).toBeTruthy();
    expect(menuButton.getAttribute("aria-expanded")).toBe("false");
  });

  it("renders action menu items inside the dropdown for inactive operator", async () => {
    renderWithProviders(<OperatorsPage />);
    await screen.findByText("Inactive Lines");

    const inactiveRow = screen.getByText("Inactive Lines").closest("tr");
    const menuButton = inactiveRow?.querySelector('[aria-haspopup="menu"]') as HTMLElement;
    expect(menuButton).toBeTruthy();
    expect(menuButton.getAttribute("aria-expanded")).toBe("false");
  });
});
