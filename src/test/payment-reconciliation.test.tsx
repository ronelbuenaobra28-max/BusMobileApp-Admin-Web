import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import PaymentReconciliationPage from "@/pages/PaymentReconciliationPage";
import type { PaymentReconciliation } from "@/types";

let mockData: PaymentReconciliation | undefined;

vi.mock("@/lib/api-hooks", () => ({
  usePaymentReconciliation: () => ({
    data: mockData,
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

function renderPage() {
  return render(
    <BrowserRouter>
      <PaymentReconciliationPage />
    </BrowserRouter>,
  );
}

describe("PaymentReconciliationPage", () => {
  beforeEach(() => {
    mockData = undefined;
  });

  it("lists refund-required payments and unmatched gateway events", () => {
    mockData = {
      refund_required_payments: [
        {
          id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
          booking_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
          booking_group_id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
          provider: "xendit",
          provider_ref: "ps_late_123",
          amount: 1205,
          status: "refund_required",
          created_at: "2026-10-01T08:00:00Z",
          passenger_id: null,
          passenger_email: "late@example.com",
          trip_id: null,
          route_name: "Manila - Baguio",
          scheduled_departure: null,
        },
      ],
      unmatched_events: [
        {
          id: 1,
          event: "payment_session.completed",
          session_id: "ps_unknown_456",
          reference_id: null,
          booking_id: null,
          amount: 105,
          currency: "PHP",
          webhook_status: "COMPLETED",
          reason: "captured payment for an unknown session reference",
          created_at: "2026-10-01T09:00:00Z",
        },
      ],
    };
    renderPage();
    expect(screen.getByText("Refund required (1)")).toBeInTheDocument();
    expect(screen.getByText("late@example.com")).toBeInTheDocument();
    expect(screen.getByText("ps_late_123")).toBeInTheDocument();
    expect(screen.getByText("₱1,205.00")).toBeInTheDocument();
    expect(screen.getByText("Unmatched gateway events (1)")).toBeInTheDocument();
    expect(screen.getByText("ps_unknown_456")).toBeInTheDocument();
  });

  it("shows empty states when nothing needs attention", () => {
    mockData = { refund_required_payments: [], unmatched_events: [] };
    renderPage();
    expect(screen.getByText("Nothing to refund")).toBeInTheDocument();
    expect(screen.getByText("No unmatched events")).toBeInTheDocument();
  });
});
