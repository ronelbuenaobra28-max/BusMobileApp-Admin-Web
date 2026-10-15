import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import PaymentReconciliationPage from "@/pages/PaymentReconciliationPage";
import type { PaymentReconciliation, RefundRequiredPayment, PaymentReconciliationEvent } from "@/types";

let mockData: PaymentReconciliation | undefined;
const recordRefund = vi.fn();
const resolveEvent = vi.fn();
const reconciliationArgs: unknown[] = [];

vi.mock("@/lib/api-hooks", () => ({
  usePaymentReconciliation: (includeResolved: boolean) => {
    reconciliationArgs.push(includeResolved);
    return { data: mockData, isLoading: false, isFetching: false, error: null, refetch: vi.fn() };
  },
  useRecordPaymentRefund: () => ({ mutateAsync: recordRefund, isPending: false }),
  useResolveReconciliationEvent: () => ({ mutateAsync: resolveEvent, isPending: false }),
}));

const noResolution = {
  resolution_action: null,
  resolution_amount: null,
  resolution_refund_ref: null,
  resolution_note: null,
  resolved_by_email: null,
  resolved_at: null,
} as const;

const payment: RefundRequiredPayment = {
  id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  booking_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  booking_group_id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
  provider: "xendit",
  provider_ref: "ps_late_123",
  amount: 1205,
  status: "refund_required",
  created_at: "2026-10-01T08:00:00Z",
  status_updated_at: "2026-10-01T08:07:00Z",
  passenger_id: null,
  passenger_email: "late@example.com",
  trip_id: null,
  route_name: "Manila - Baguio",
  scheduled_departure: null,
  ...noResolution,
};

const event: PaymentReconciliationEvent = {
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
  provider_created_at: "2026-10-01T08:59:58Z",
  ...noResolution,
};

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
    recordRefund.mockReset().mockResolvedValue({});
    resolveEvent.mockReset().mockResolvedValue({});
    reconciliationArgs.length = 0;
  });

  it("lists refund-required payments and unmatched gateway events", () => {
    mockData = { refund_required_payments: [payment], unmatched_events: [event] };
    renderPage();
    expect(screen.getByText("Refund required (1)")).toBeInTheDocument();
    expect(screen.getByText("late@example.com")).toBeInTheDocument();
    expect(screen.getByText("ps_late_123")).toBeInTheDocument();
    expect(screen.getByText("₱1,205.00")).toBeInTheDocument();
    expect(screen.getByText("Unmatched gateway events (1)")).toBeInTheDocument();
    expect(screen.getByText("ps_unknown_456")).toBeInTheDocument();
  });

  it("labels checkout-open time separately from the flagged time", () => {
    mockData = { refund_required_payments: [payment], unmatched_events: [event] };
    renderPage();
    expect(screen.getByText("Flagged")).toBeInTheDocument();
    expect(screen.getByText(`Checkout opened ${new Date(payment.created_at).toLocaleString()}`)).toBeInTheDocument();
    expect(screen.getByText(new Date(payment.status_updated_at!).toLocaleString())).toBeInTheDocument();
    expect(screen.getByText(`Xendit time ${new Date(event.provider_created_at!).toLocaleString()}`)).toBeInTheDocument();
    expect(screen.queryByText("Captured")).not.toBeInTheDocument();
  });

  it("shows Unknown when the transition time predates migration 042", () => {
    mockData = { refund_required_payments: [{ ...payment, status_updated_at: null }], unmatched_events: [] };
    renderPage();
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("records a refund with amount, Xendit reference and note", async () => {
    mockData = { refund_required_payments: [payment], unmatched_events: [] };
    renderPage();
    fireEvent.click(screen.getByText("Record refund"));
    const record = screen.getByRole("button", { name: "Record" });
    expect(record).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Refunded amount (PHP)"), { target: { value: "1205.00" } });
    fireEvent.change(screen.getByLabelText("Xendit refund reference"), { target: { value: " rfd_1 " } });
    fireEvent.change(screen.getByLabelText("Note"), { target: { value: "Late capture refunded" } });
    fireEvent.click(record);
    await waitFor(() =>
      expect(recordRefund).toHaveBeenCalledWith({
        paymentId: payment.id,
        body: { amount: "1205.00", provider_refund_ref: "rfd_1", note: "Late capture refunded" },
      }),
    );
  });

  it("closes an event without a refund using only a note", async () => {
    mockData = { refund_required_payments: [], unmatched_events: [event] };
    renderPage();
    fireEvent.click(screen.getByText("Resolve"));
    fireEvent.click(screen.getByLabelText("No refund needed"));
    expect(screen.queryByLabelText("Xendit refund reference")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Note"), { target: { value: "Test-mode session" } });
    fireEvent.click(screen.getByRole("button", { name: "Record" }));
    await waitFor(() =>
      expect(resolveEvent).toHaveBeenCalledWith({
        eventId: 1,
        body: { action: "no_refund_needed", note: "Test-mode session" },
      }),
    );
  });

  it("shows the audit trail instead of an action once resolved", () => {
    mockData = {
      refund_required_payments: [{
        ...payment,
        status: "refunded",
        resolution_action: "refunded",
        resolution_amount: 1205,
        resolution_refund_ref: "rfd_1",
        resolution_note: "done",
        resolved_by_email: "admin@example.com",
        resolved_at: "2026-10-02T01:00:00Z",
      }],
      unmatched_events: [],
    };
    renderPage();
    expect(screen.getByText("Refund required (0)")).toBeInTheDocument();
    expect(screen.getByText("Refunded ₱1,205.00 · rfd_1")).toBeInTheDocument();
    expect(screen.getByText(/by admin@example.com/)).toBeInTheDocument();
    expect(screen.queryByText("Record refund")).not.toBeInTheDocument();
  });

  it("hides resolved items until 'Show resolved' is ticked", () => {
    mockData = { refund_required_payments: [], unmatched_events: [] };
    renderPage();
    expect(reconciliationArgs.at(-1)).toBe(false);
    fireEvent.click(screen.getByLabelText("Show resolved"));
    expect(reconciliationArgs.at(-1)).toBe(true);
  });

  it("shows empty states when nothing needs attention", () => {
    mockData = { refund_required_payments: [], unmatched_events: [] };
    renderPage();
    expect(screen.getByText("Nothing to refund")).toBeInTheDocument();
    expect(screen.getByText("No unmatched events")).toBeInTheDocument();
  });
});
