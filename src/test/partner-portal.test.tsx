import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { homePathFor } from "@/lib/roles";
import { ADMIN_NAV, PARTNER_NAV, navItemFor } from "@/components/layout/nav";
import type { AdminProfile } from "@/contexts/AuthContext";

// ---------------------------------------------------------------------------
// Auth + data mocks
// ---------------------------------------------------------------------------
let profile: AdminProfile | null = null;
const logout = vi.fn(async () => {});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    profile,
    initialized: true,
    loading: false,
    login: vi.fn(),
    logout,
    refreshProfile: vi.fn(),
  }),
}));

const createStaff = vi.fn();
const removeStaff = vi.fn();
let staffList: { user_id: string; email: string; first_name: string; last_name: string; created_at: string }[] = [];

vi.mock("@/lib/partner-hooks", () => ({
  usePartnerMe: () => ({ data: { operator_name: "Victory Liner", first_name: "Vic" } }),
  usePartnerSales: () => ({
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
    data: {
      date_from: "2026-10-01",
      date_to: "2026-10-23",
      group: "day",
      rows: [
        { period: "2026-10-22", transactions: 2, seats: 3, collected: 2260, seatpass_fees: 10, ticket_sales: 2250, refunded_count: 0, refunded_amount: 0 },
      ],
      totals: { period: "2026-10-01", transactions: 2, seats: 3, collected: 2260, seatpass_fees: 10, ticket_sales: 2250, refunded_count: 1, refunded_amount: 755 },
    },
  }),
  useOperatorStaff: () => ({ data: staffList, isLoading: false, error: null }),
  useCreateOperatorStaff: () => ({ mutateAsync: createStaff, isPending: false }),
  useRemoveOperatorStaff: () => ({ mutateAsync: removeStaff, isPending: false }),
}));

// Route tests import every page; the map pages pull in MapLibre, which needs
// browser APIs jsdom lacks.
vi.mock("maplibre-gl", () => ({ default: {} }));

// Keep route tests about routing: every page is a labelled stub.
vi.mock("@/components/layout/AdminLayout", async () => {
  const { Outlet } = await import("react-router-dom");
  return { default: () => <div data-testid="admin-shell"><Outlet /></div> };
});
vi.mock("@/components/layout/PartnerLayout", async () => {
  const { Outlet } = await import("react-router-dom");
  return { default: () => <div data-testid="partner-shell"><Outlet /></div> };
});
vi.mock("@/pages/DashboardPage", () => ({ default: () => <p>Admin dashboard</p> }));
vi.mock("@/pages/partner/PartnerOverviewPage", () => ({ default: () => <p>Partner overview</p> }));
vi.mock("@/pages/partner/PartnerBookingsPage", () => ({ default: () => <p>Partner bookings</p> }));

const asProfile = (role: AdminProfile["role"]): AdminProfile => ({
  user_id: "u1",
  role,
  email: "x@example.com",
  first_name: "X",
});

async function renderRoutes(path: string) {
  const { default: AdminRoutes } = await import("@/routes/AdminRoutes");
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AdminRoutes />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  profile = null;
  logout.mockClear();
  createStaff.mockReset();
  removeStaff.mockReset();
  staffList = [];
});

describe("role helpers", () => {
  it("sends each role to its own console", () => {
    expect(homePathFor("admin")).toBe("/");
    expect(homePathFor("operator")).toBe("/partner");
    expect(homePathFor("passenger")).toBeNull();
    expect(homePathFor("driver")).toBeNull();
  });

  it("resolves partner and admin pages from their own menus", () => {
    expect(navItemFor("/partner", PARTNER_NAV)?.label).toBe("Overview");
    expect(navItemFor("/partner/sales", PARTNER_NAV)?.label).toBe("Sales");
    expect(navItemFor("/buses/123", ADMIN_NAV)?.label).toBe("Buses");
    expect(navItemFor("/", ADMIN_NAV)?.label).toBe("Dashboard");
  });
});

describe("role-based routing", () => {
  it("keeps operator staff out of the admin console", async () => {
    profile = asProfile("operator");
    await renderRoutes("/");
    expect(await screen.findByText("Partner overview")).toBeInTheDocument();
    expect(screen.queryByText("Admin dashboard")).not.toBeInTheDocument();
  });

  it("keeps admins on the admin console", async () => {
    profile = asProfile("admin");
    await renderRoutes("/partner/bookings");
    expect(await screen.findByText("Admin dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Partner bookings")).not.toBeInTheDocument();
  });

  it("lets operator staff open partner pages", async () => {
    profile = asProfile("operator");
    await renderRoutes("/partner/bookings");
    expect(await screen.findByText("Partner bookings")).toBeInTheDocument();
  });

  it("signs out passenger accounts with a clear message", async () => {
    profile = asProfile("passenger");
    await renderRoutes("/");
    expect(await screen.findByText(/This account is for the SeatPass mobile app/)).toBeInTheDocument();
    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
  });
});

describe("Partner sales page", () => {
  it("shows ticket sales separately from the SeatPass fee", async () => {
    const { default: PartnerSalesPage } = await import("@/pages/partner/PartnerSalesPage");
    render(
      <MemoryRouter>
        <PartnerSalesPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Ticket sales (your kita)")).toBeInTheDocument();
    // Tile and table total both show the fares, not what passengers paid.
    expect(screen.getAllByText("₱2,250.00").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("₱2,260.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/SeatPass booking fee per transaction/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export CSV/ })).toBeEnabled();
  });
});

describe("Operator staff card", () => {
  it("shows the temporary password once after creating an account", async () => {
    createStaff.mockResolvedValue({
      user_id: "s1",
      email: "ops@victory.ph",
      first_name: "Vic",
      last_name: "Staff",
      created_at: "2026-10-23T00:00:00Z",
      temporary_password: "SeatPass-abc123XYZ",
    });
    const { OperatorStaffCard } = await import("@/components/operators/OperatorStaffCard");
    render(<OperatorStaffCard operatorId="op1" operatorName="Victory Liner" />);

    expect(screen.getByText(/No staff accounts yet/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Add staff account/ }));
    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Vic" } });
    fireEvent.change(screen.getByLabelText("Last name"), { target: { value: "Staff" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: " ops@victory.ph " } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(createStaff).toHaveBeenCalledWith({ first_name: "Vic", last_name: "Staff", email: "ops@victory.ph" }),
    );
    expect(await screen.findByText("SeatPass-abc123XYZ")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(screen.queryByText("SeatPass-abc123XYZ")).not.toBeInTheDocument());
  });

  it("asks before removing a staff account", async () => {
    staffList = [
      { user_id: "s1", email: "ops@victory.ph", first_name: "Vic", last_name: "Staff", created_at: "2026-10-23T00:00:00Z" },
    ];
    removeStaff.mockResolvedValue(undefined);
    const { OperatorStaffCard } = await import("@/components/operators/OperatorStaffCard");
    render(<OperatorStaffCard operatorId="op1" operatorName="Victory Liner" />);

    fireEvent.click(screen.getByRole("button", { name: "Remove ops@victory.ph" }));
    expect(removeStaff).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: "Remove account" }));
    await waitFor(() => expect(removeStaff).toHaveBeenCalledWith("s1"));
  });
});
