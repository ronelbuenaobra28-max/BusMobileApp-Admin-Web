import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  it("renders operator rows", async () => {
    renderWithProviders(<OperatorsPage />);
    expect(await screen.findByText("Active Transit")).toBeVisible();
    expect(screen.getByText("Inactive Lines")).toBeVisible();
  });

  it("opens action menu when clicking the three-dot button for an active operator", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OperatorsPage />);

    const activeRow = await screen.findByText("Active Transit");
    expect(activeRow).toBeVisible();

    const activeMenuButton = activeRow.closest("tr")?.querySelector('[aria-haspopup="menu"]');
    expect(activeMenuButton).toBeTruthy();
    await user.click(activeMenuButton!);

    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeVisible();
      expect(screen.getByText("Deactivate")).toBeVisible();
      expect(screen.getByText("View details")).toBeVisible();
    });
  });

  it("opens action menu with Activate for an inactive operator", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OperatorsPage />);

    const inactiveRow = await screen.findByText("Inactive Lines");
    expect(inactiveRow).toBeVisible();

    const inactiveMenuButton = inactiveRow.closest("tr")?.querySelector('[aria-haspopup="menu"]');
    expect(inactiveMenuButton).toBeTruthy();
    await user.click(inactiveMenuButton!);

    await waitFor(() => {
      expect(screen.getByText("Activate")).toBeVisible();
      expect(screen.getByText("Edit")).toBeVisible();
      expect(screen.getByText("View details")).toBeVisible();
    });
  });

  it("closes the menu after pressing Escape", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OperatorsPage />);

    const activeRow = await screen.findByText("Active Transit");
    expect(activeRow).toBeVisible();

    const activeMenuButton = activeRow.closest("tr")?.querySelector('[aria-haspopup="menu"]');
    expect(activeMenuButton).toBeTruthy();
    await user.click(activeMenuButton!);

    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeVisible();
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    });
  });
});
