import { Bus, UserCog } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { usePartnerFleet } from "@/lib/partner-hooks";
import { count, dateTime } from "@/lib/format";

export default function PartnerFleetPage() {
  const { data, isLoading, error, refetch } = usePartnerFleet();

  return (
    <div className="h-full space-y-6 overflow-y-auto pb-2">
      <PageHeader title="Fleet" description="Your buses on SeatPass and the drivers on your trips" />

      {error && <ErrorState title="Couldn't load your fleet" message={error.message} onRetry={() => void refetch()} />}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">
            Buses {data && <span className="font-normal text-slate-500">({data.buses.length})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : !data || data.buses.length === 0 ? (
            <EmptyState title="No buses yet" description="SeatPass adds your buses for you." icon={<Bus />} />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {data.buses.map((b) => (
                <li
                  key={b.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                        <Bus className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{b.bus_number}</p>
                        <p className="text-xs text-slate-500">
                          {b.capacity} seats{b.seating_layout && b.seating_layout !== "legacy" ? ` · ${b.seating_layout}` : ""}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {b.upcoming_trips === 0
                      ? "No upcoming trips"
                      : `${count(b.upcoming_trips)} upcoming ${b.upcoming_trips === 1 ? "trip" : "trips"}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">
            Drivers {data && <span className="font-normal text-slate-500">({data.drivers.length})</span>}
          </CardTitle>
          <p className="text-xs text-slate-500">Drivers who drove or are scheduled on your trips in the last 90 days</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : !data || data.drivers.length === 0 ? (
            <EmptyState title="No drivers yet" description="Drivers appear once they are scheduled on your trips." icon={<UserCog />} />
          ) : (
            <table className="data-table w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">License no.</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last trip</th>
                </tr>
              </thead>
              <tbody>
                {data.drivers.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{d.full_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{d.license_no}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">{d.last_trip_at ? dateTime(d.last_trip_at) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
