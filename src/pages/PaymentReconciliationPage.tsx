import { useState } from "react";
import {
  PageHeader,
  EmptyState,
  Skeleton,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from "@/components/ui";
import {
  usePaymentReconciliation,
  useRecordPaymentRefund,
  useResolveReconciliationEvent,
} from "@/lib/api-hooks";
import ListPageShell from "@/components/layout/ListPageShell";
import type { PaymentReconciliationEvent, RefundRequiredPayment } from "@/types";

const peso = (amount: number | null) =>
  amount == null
    ? "—"
    : `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

const shortId = (id: string | null) => (id ? `${id.slice(0, 8)}...` : "—");

type Target =
  | { kind: "payment"; payment: RefundRequiredPayment }
  | { kind: "event"; event: PaymentReconciliationEvent };

function Resolution({ item }: { item: RefundRequiredPayment | PaymentReconciliationEvent }) {
  if (!item.resolution_action) return null;
  return (
    <div className="text-xs text-slate-500">
      {item.resolution_action === "refunded"
        ? `Refunded ${peso(item.resolution_amount)} · ${item.resolution_refund_ref}`
        : "Closed: no refund needed"}
      <div>
        by {item.resolved_by_email ?? "admin"} · {when(item.resolved_at)}
      </div>
    </div>
  );
}

function ResolveDialog({ target, onClose }: { target: Target | null; onClose: () => void }) {
  const recordRefund = useRecordPaymentRefund();
  const resolveEvent = useResolveReconciliationEvent();
  const [action, setAction] = useState<"refunded" | "no_refund_needed">("refunded");
  const [amount, setAmount] = useState("");
  const [refundRef, setRefundRef] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isPayment = target?.kind === "payment";
  const refunding = isPayment || action === "refunded";
  const pending = recordRefund.isPending || resolveEvent.isPending;

  const reset = () => {
    setAction("refunded");
    setAmount("");
    setRefundRef("");
    setNote("");
    setError(null);
  };

  const submit = async () => {
    if (!target) return;
    setError(null);
    try {
      if (target.kind === "payment") {
        await recordRefund.mutateAsync({
          paymentId: target.payment.id,
          body: { amount, provider_refund_ref: refundRef.trim(), note: note.trim() },
        });
      } else {
        await resolveEvent.mutateAsync({
          eventId: target.event.id,
          body:
            action === "refunded"
              ? { action, amount, provider_refund_ref: refundRef.trim(), note: note.trim() }
              : { action, note: note.trim() },
        });
      }
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record the resolution.");
    }
  };

  const canSubmit =
    note.trim().length > 0 && (!refunding || (Number(amount) > 0 && refundRef.trim().length > 0));

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isPayment ? "Record refund" : "Resolve gateway event"}</DialogTitle>
          <DialogDescription>
            Issue the refund in the Xendit dashboard first. This only records it, with your name and
            the time, and cannot be edited afterwards.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {!isPayment && (
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={action === "refunded"} onChange={() => setAction("refunded")} />
                Refunded
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={action === "no_refund_needed"}
                  onChange={() => setAction("no_refund_needed")}
                />
                No refund needed
              </label>
            </div>
          )}
          {refunding && (
            <>
              <div>
                <Label htmlFor="refund-amount">Refunded amount (PHP)</Label>
                <Input
                  id="refund-amount"
                  inputMode="decimal"
                  value={amount}
                  placeholder={
                    target?.kind === "payment" ? target.payment.amount.toFixed(2) : "0.00"
                  }
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="refund-ref">Xendit refund reference</Label>
                <Input id="refund-ref" value={refundRef} onChange={(e) => setRefundRef(e.target.value)} />
              </div>
            </>
          )}
          <div>
            <Label htmlFor="refund-note">Note</Label>
            <Textarea id="refund-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit || pending}>
            {pending ? "Saving..." : "Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PaymentReconciliationPage() {
  const [includeResolved, setIncludeResolved] = useState(false);
  const [target, setTarget] = useState<Target | null>(null);
  const { data, isLoading, error, refetch, isFetching } = usePaymentReconciliation(includeResolved);
  const payments = data?.refund_required_payments ?? [];
  const events = data?.unmatched_events ?? [];
  const openPayments = payments.filter((p) => p.status === "refund_required").length;
  const openEvents = events.filter((e) => !e.resolution_action).length;

  return (
    <ListPageShell
      header={
        <PageHeader
          title="Payment Reconciliation"
          description="Captured payments that need a manual refund or review. Refunds are issued in the Xendit dashboard and recorded here."
          action={
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={includeResolved}
                  onChange={(e) => setIncludeResolved(e.target.checked)}
                />
                Show resolved
              </label>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                {isFetching ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
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
                Refund required ({openPayments})
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
                        <th className="px-4 py-3">Flagged</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Passenger</th>
                        <th className="px-4 py-3">Route / Departure</th>
                        <th className="px-4 py-3">Booking Ref</th>
                        <th className="px-4 py-3">Xendit Session</th>
                        <th className="px-4 py-3">Resolution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-slate-700">
                            <div>{p.status_updated_at ? when(p.status_updated_at) : "Unknown"}</div>
                            <div className="text-xs text-slate-500">Checkout opened {when(p.created_at)}</div>
                          </td>
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
                          <td className="px-4 py-3">
                            {p.resolution_action ? (
                              <Resolution item={p} />
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => setTarget({ kind: "payment", payment: p })}>
                                Record refund
                              </Button>
                            )}
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
                Unmatched gateway events ({openEvents})
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
                        <th className="px-4 py-3">Resolution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((e) => (
                        <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-slate-700">
                            <div>{when(e.created_at)}</div>
                            {e.provider_created_at && (
                              <div className="text-xs text-slate-500">Xendit time {when(e.provider_created_at)}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{e.event}</td>
                          <td className="px-4 py-3 text-slate-700">{e.webhook_status ?? "—"}</td>
                          <td className="px-4 py-3 text-slate-700">
                            {e.currency && e.currency !== "PHP" ? `${e.amount ?? "—"} ${e.currency}` : peso(e.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs">{e.session_id ?? "—"}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{e.reason}</td>
                          <td className="px-4 py-3">
                            {e.resolution_action ? (
                              <Resolution item={e} />
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => setTarget({ kind: "event", event: e })}>
                                Resolve
                              </Button>
                            )}
                          </td>
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
      <ResolveDialog target={target} onClose={() => setTarget(null)} />
    </ListPageShell>
  );
}
