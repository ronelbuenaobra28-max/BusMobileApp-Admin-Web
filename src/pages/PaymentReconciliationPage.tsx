import { PageHeader, EmptyState, Skeleton, Button } from "@/components/ui";
import { usePaymentReconciliation } from "@/lib/api-hooks";
import ListPageShell from "@/components/layout/ListPageShell";

const peso = (amount: number | null) =>
  amount == null
    ? "—"
    : `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

const shortId = (id: string | null) => (id ? `${id.slice(0, 8)}...` : "—");

export default function PaymentReconciliationPage() {
  const { data, isLoading, error, refetch, isFetching } = usePaymentReconciliation();
  const payments = data?.refund_required_payments ?? [];
  const events = data?.unmatched_events ?? [];

  return (
    <ListPageShell
      header={
        <PageHeader
          title="Payment Reconciliation"
          description="Captured payments that need a manual refund or review. Read-only: refunds are issued in the Xendit dashboard."
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "Refreshing..." : "Refresh"}
            </Button>
          }
        />
      }
    >
      <div className="space-y-8 p-4">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600">
            Failed to load reconciliation data.
            <Button variant="ghost" size="sm" className="ml-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <section>
              <h2 className="mb-1 text-sm font-semibold text-slate-900">
                Refund required ({payments.length})
              </h2>
              <p className="mb-3 text-xs text-slate-500">
                Money was captured but the seats could not be confirmed, for example a payment that
                arrived after the booking hold expired. No ticket was issued.
              </p>
              {payments.length === 0 ? (
                <EmptyState title="Nothing to refund" description="No payments are awaiting a refund." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-slate-500">
                        <th className="px-4 py-3">Captured</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Passenger</th>
                        <th className="px-4 py-3">Route / Departure</th>
                        <th className="px-4 py-3">Booking Ref</th>
                        <th className="px-4 py-3">Xendit Session</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-slate-700">{when(p.created_at)}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{peso(p.amount)}</td>
                          <td className="px-4 py-3 text-slate-700">{p.passenger_email ?? "—"}</td>
                          <td className="px-4 py-3 text-slate-700">
                            <div>{p.route_name ?? "—"}</div>
                            <div className="text-xs text-slate-500">{when(p.scheduled_departure)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs">{shortId(p.booking_group_id)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs">{p.provider_ref ?? "—"}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-slate-900">
                Unmatched gateway events ({events.length})
              </h2>
              <p className="mb-3 text-xs text-slate-500">
                Xendit events that matched no payment, or whose amount or currency disagreed with it.
                Check each one in the Xendit dashboard.
              </p>
              {events.length === 0 ? (
                <EmptyState title="No unmatched events" description="Every gateway event matched a payment." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-slate-500">
                        <th className="px-4 py-3">Received</th>
                        <th className="px-4 py-3">Event</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Xendit Session</th>
                        <th className="px-4 py-3">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((e) => (
                        <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-slate-700">{when(e.created_at)}</td>
                          <td className="px-4 py-3 text-slate-700">{e.event}</td>
                          <td className="px-4 py-3 text-slate-700">{e.webhook_status ?? "—"}</td>
                          <td className="px-4 py-3 text-slate-700">
                            {e.currency && e.currency !== "PHP" ? `${e.amount ?? "—"} ${e.currency}` : peso(e.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs">{e.session_id ?? "—"}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{e.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </ListPageShell>
  );
}
