import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, Ticket, X } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import ListPageShell from "@/components/layout/ListPageShell";
import { usePartnerBookings } from "@/lib/partner-hooks";
import { dateTime, peso } from "@/lib/format";

const PAGE_SIZE = 25;

const STATUSES = [
  { value: "all", label: "All statuses" },
  { value: "paid", label: "Paid" },
  { value: "boarded", label: "Boarded" },
  { value: "pending", label: "Pending payment" },
  { value: "cancelled", label: "Cancelled" },
];

export default function PartnerBookingsPage() {
  const [params, setParams] = useSearchParams();
  const tripId = params.get("trip") ?? undefined;
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);

  // Search as you type, but only ask the server once typing pauses.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching, error, refetch } = usePartnerBookings({
    q,
    status,
    date_from: dateFrom,
    date_to: dateTo,
    trip_id: tripId,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });
  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PAGE_SIZE);

  const clearTrip = () => {
    params.delete("trip");
    setParams(params, { replace: true });
    setPage(0);
  };

  const selectClass =
    "h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm hover:border-slate-300 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20";

  return (
    <ListPageShell
      header={
        <PageHeader
          title="Bookings"
          description="Every online reservation on your trips. One row per reservation; seats bought together are listed together."
        />
      }
      filters={
        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                aria-label="Search bookings"
                placeholder="Search passenger, seat, reference, route or bus..."
                className="bg-white pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              aria-label="Status"
              className={selectClass}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span className="whitespace-nowrap">Departs from</span>
              <Input
                type="date"
                aria-label="Departure date from"
                className="w-[150px] bg-white"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(0);
                }}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span>to</span>
              <Input
                type="date"
                aria-label="Departure date to"
                className="w-[150px] bg-white"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(0);
                }}
              />
            </label>
          </div>
          {tripId && (
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 font-medium text-primary-800 ring-1 ring-inset ring-primary-600/20">
                Showing one trip
                <button
                  type="button"
                  onClick={clearTrip}
                  aria-label="Show all trips"
                  className="rounded-full p-0.5 hover:bg-primary-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
          )}
        </div>
      }
    >
      {error ? (
        <ErrorState className="m-4" title="Couldn't load bookings" message={error.message} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : total === 0 ? (
        <EmptyState
          className="m-4"
          title="No bookings found"
          description={
            q || status !== "all" || dateFrom || dateTo || tripId
              ? "Try a different search or clear the filters."
              : "Reservations on your trips will appear here."
          }
          icon={<Ticket />}
        />
      ) : (
        <div className="flex h-full min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-auto p-4">
            <table className="data-table w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Passengers</th>
                  <th className="px-4 py-3">Seats</th>
                  <th className="px-4 py-3">Trip</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ticket sales</th>
                </tr>
              </thead>
              <tbody className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
                {data!.items.map((b) => (
                  <tr key={`${b.reference}-${b.trip_id}-${b.booked_at}`} className="border-b border-slate-100 align-top">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-semibold text-slate-900">{b.reference}</p>
                      <p className="text-xs text-slate-500">Booked {dateTime(b.booked_at)}</p>
                    </td>
                    <td className="max-w-[240px] px-4 py-3 text-slate-900">{b.passengers}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{b.seats}</p>
                      <p className="text-xs text-slate-500">
                        {b.seat_count} {b.seat_count === 1 ? "seat" : "seats"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {b.origin} → {b.destination}
                      </p>
                      <p className="text-xs text-slate-500">
                        {dateTime(b.scheduled_departure)} · Bus {b.bus_number}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} label={b.status === "pending" ? "Pending payment" : undefined} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {b.ticket_sales == null ? <span className="text-slate-500">—</span> : peso(b.ticket_sales)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
            <span>
              Showing {from}–{to} of {total}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
              </Button>
              <Button variant="outline" size="sm" disabled={to >= total} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </ListPageShell>
  );
}
