import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import RouteStopsPage from "@/pages/RouteStopsPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/components/map/RouteMap", () => ({
  __esModule: true,
  default: () => <div data-testid="route-map-mock">Route Map Mock</div>,
  RouteMap: () => <div data-testid="route-map-mock">Route Map Mock</div>,
}));

const mockStops = [
  {
    id: "1",
    route_id: "route-1",
    name: "Calamba",
    latitude: 14.2,
    longitude: 121.1,
    sequence: 1,
    point_type: "origin",
    distance_from_origin_km: 0.0,
  },
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
  useRoutes: () => ({
    data: [{ id: "route-1", name: "Test Route", origin: "Manila", destination: "Baguio", distance_km: 311.4 }],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useRouteStops: () => ({
    data: mockStops,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useAddStop: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateStop: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteStop: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useRouteGeometry: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("RouteStopsPage geocoding", () => {
  const openEditForm = async () => {
    renderWithProviders(<RouteStopsPage />);
    const editButton = await screen.findByText("Edit");
    fireEvent.click(editButton);
  };

  it("renders search location field", async () => {
    await openEditForm();
    expect(await screen.findByText("Search location")).toBeVisible();
  });

  it("shows searching state while loading", async () => {
    await openEditForm();

    const searchInput = (await screen.findByPlaceholderText("Search place or address")) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: "Baguio Central Terminal" } });

    expect(await screen.findByText("Searching...")).toBeVisible();
  });

  it("does not search for short queries", async () => {
    await openEditForm();

    const searchInput = (await screen.findByPlaceholderText("Search place or address")) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: "B" } });

    expect(screen.queryByText("Searching...")).not.toBeInTheDocument();
    expect(screen.queryByText("No matching locations found.")).not.toBeInTheDocument();
  });

  it("shows error when MapTiler API key is missing", async () => {
    const originalEnv = import.meta.env.VITE_MAPTILER_API_KEY;
    vi.stubGlobal("import.meta", {
      env: { ...import.meta.env, VITE_MAPTILER_API_KEY: "" },
    });

    await openEditForm();

    const searchInput = (await screen.findByPlaceholderText("Search place or address")) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: "Baguio Central Terminal" } });

    await waitFor(() => {
      expect(screen.getByText("MapTiler API key is not configured.")).toBeVisible();
    });

    vi.stubGlobal("import.meta", {
      env: { ...import.meta.env, VITE_MAPTILER_API_KEY: originalEnv },
    });
  });

  it("preserves map-click workflow", async () => {
    renderWithProviders(<RouteStopsPage />);
    expect(await screen.findByTestId("route-map-mock")).toBeVisible();
  });
});
