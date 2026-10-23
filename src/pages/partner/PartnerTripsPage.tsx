import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import ListPageShell from "@/components/layout/ListPageShell";
import { LoadBar } from "@/components/partner/widgets";
import { usePartnerTrips } from "@/lib/partner-hooks";
import { count, dateTime, peso, timeOnly } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function PartnerTripsPage() {
  const [scope, setScope] = useState<"upcoming" | "past">("upcoming");
  const { data, isLoading, error, refetch } = usePartnerTrips(scope);

  return (
    <ListPageShell
      header={<PageHeader title="Trips" description="Your departures and how many seats each one has sold" />}
      filters={
        <div className="inline-flex w-fit rounded-lg border border-slate-200 bg-white p-1" role="tablist" aria-label="Trips">
          {(["upcoming", "past"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={scope === s}
              onClick={() => setScope(s)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors",
                scope === s ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      }
    >
      {error ? (
        <ErrorState className="m-4" title="Couldn't load trips" message={error.message} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          className="m-4"
          title={scope === "upcoming" ? "No upcoming trips" : "No past trips yet"}
          description="Trips are scheduled by SeatPass for your buses."
          icon={<CalendarDays />}
        />
      ) : (
        <div className="p-4">
          <table className="data-table w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-4 py-3">Departure</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Bus &amp; driver</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Seats sold</th>
                <th className="px-4 py-3 text-right">Boarded</th>
                <th className="px-4 py-3 text-right">Ticket sales</th>
                <th className="w-10 px-2 py-3" aria-label="Open bookings" />
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{dateTime(t.scheduled_departure)}</p>
                    {t.arrival_time && (
                      <p className="text-xs text-slate-500">Arrives {timeOnly(t.arrival_time)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {t.origin} → {t.destination}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-900">Bus {t.bus_number}</p>
                    <p className="text-xs text-slate-500">{t.driver_name ?? "No driver assigned"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} label={t.status === "active" ? "On route" : undefined} />
                  </td>
                  <td className="px-4 py-3">
                    <LoadBar sold={t.seats_sold} capacity={t.capacity} />
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{count(t.boarded)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">{peso(t.ticket_sales)}</td>
                  <td className="px-2 py-3">
                    <Link
                      to={`/partner/bookings?trip=${t.id}`}
                      title="See this trip's bookings"
                      aria-label={`See bookings for ${t.origin} to ${t.destination}, ${dateTime(t.scheduled_departure)}`}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-primary"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ListPageShell>
  );
}
