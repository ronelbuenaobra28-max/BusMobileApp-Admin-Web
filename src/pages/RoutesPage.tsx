"use client";

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreVertical, Trash2 } from "lucide-react";
import {
  PageHeader,
  Button,
  Input,
  Card,
  EmptyState,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Label,
  ConfirmDialog,
  Skeleton,
} from "@/components/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionToolbar } from "@/components/bulk-action-toolbar";
import { BulkConfirmDialog } from "@/components/bulk-confirm-dialog";
import { useRoutes, useCreateRoute, useUpdateRoute, useDeleteRoute, useBulkDeleteRoutes, useOperators, useTerminals, useRefreshRouteGeometry } from "@/lib/api-hooks";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { toast } from "sonner";

export default function RoutesPage() {
  const { data: routes, isLoading, error, refetch } = useRoutes();
  const { data: operators } = useOperators();
  const { data: terminals } = useTerminals();
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();
  const deleteRoute = useDeleteRoute();
  const bulkDeleteRoutes = useBulkDeleteRoutes();
  const refreshGeometry = useRefreshRouteGeometry();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; origin: string; destination: string } | null>(null);
  const [form, setForm] = useState({ name: "", origin: "", destination: "" });
  const [selectedOperatorIds, setSelectedOperatorIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; origin?: string; destination?: string }>({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [terminalDialogOpen, setTerminalDialogOpen] = useState(false);
  const [editingTerminals, setEditingTerminals] = useState<{ id: string; name: string } | null>(null);
  const [selectedOriginTerminalId, setSelectedOriginTerminalId] = useState<string>("");
  const [selectedDestinationTerminalId, setSelectedDestinationTerminalId] = useState<string>("");
  const [terminalSaving, setTerminalSaving] = useState(false);

  const filtered = useMemo(() => {
    if (!routes) return [];
    const term = search.trim().toLowerCase();
    if (!term) return routes;
    return routes.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.origin.toLowerCase().includes(term) ||
        r.destination.toLowerCase().includes(term),
    );
  }, [routes, search]);

  const bulk = useBulkSelection(filtered, (r) => r.id);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", origin: "", destination: "" });
    setSelectedOperatorIds([]);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (r: { id: string; name: string; origin: string; destination: string; operators: { operator_id: string }[] }) => {
    setEditing(r);
    setForm({ name: r.name, origin: r.origin, destination: r.destination });
    setSelectedOperatorIds(r.operators.map((op) => op.operator_id));
    setErrors({});
    setDialogOpen(true);
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.name.trim()) {
      next.name = "Route name is required.";
    }
    if (!form.origin.trim()) {
      next.origin = "Origin is required.";
    }
    if (!form.destination.trim()) {
      next.destination = "Destination is required.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const doSave = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (editing) {
        await updateRoute.mutateAsync({
          id: editing.id,
          body: {
            name: form.name.trim(),
            origin: form.origin.trim(),
            destination: form.destination.trim(),
            operator_ids: selectedOperatorIds,
          },
        });
        toast.success("Route updated");
      } else {
        await createRoute.mutateAsync({
          name: form.name.trim(),
          origin: form.origin.trim(),
          destination: form.destination.trim(),
          operator_ids: selectedOperatorIds,
        });
        toast.success("Route created");
      }
      setDialogOpen(false);
      setEditing(null);
    } catch {
      toast.error("Failed to save route");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteRoute.mutateAsync(deleteId);
      toast.success("Route deleted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete route";
      toast.error(message);
    } finally {
      setDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    const ids = Array.from(bulk.selectedIds);
    try {
      const result = await bulkDeleteRoutes.mutateAsync(ids);
      bulk.clear();
      if (result.blocked_count > 0) {
        toast.error(`${result.deleted_count} deleted. ${result.blocked_count} could not be deleted because they are associated with existing trips.`);
      } else if (result.not_found_count > 0) {
        toast.success(`${result.deleted_count} deleted. ${result.not_found_count} were not found.`);
      } else {
        toast.success(`${result.deleted_count} route${result.deleted_count !== 1 ? "s" : ""} deleted`);
      }
      setBulkOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete routes";
      toast.error(message);
    } finally {
      setBulkLoading(false);
    }
  };

  const selectedRouteNames = filtered
    .filter((r) => bulk.isSelected(r.id))
    .map((r) => r.name);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Routes"
        description="Manage bus routes"
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Route
          </Button>
        }
      />

      <BulkActionToolbar
        selectedCount={bulk.selectedCount}
        onBulkDelete={() => setBulkOpen(true)}
        loading={bulkLoading}
        label="Delete"
      />

      <Card>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search routes..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading && (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {error && (
          <div className="p-4 text-sm text-red-600">
            Failed to load routes.
            <Button variant="ghost" size="sm" className="ml-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !error && filtered && filtered.length === 0 && (
          <EmptyState
            title="No routes found"
            description="Create a route to get started."
            action={
              <Button onClick={openCreate} size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Route
              </Button>
            }
          />
        )}

        {!isLoading && !error && filtered && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-4 py-3 w-10">
                    <Checkbox
                      checked={bulk.isAllSelected}
                      indeterminate={bulk.isIndeterminate}
                      onCheckedChange={bulk.toggleAll}
                      aria-label="Select all routes"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Origin</th>
                  <th className="px-4 py-3 font-medium">Destination</th>
                  <th className="px-4 py-3 font-medium">Terminals</th>
                  <th className="px-4 py-3 font-medium">Operators</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-b border-slate-100 hover:bg-slate-50/50 ${
                      bulk.isSelected(r.id) ? "bg-slate-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={bulk.isSelected(r.id)}
                        onCheckedChange={() => bulk.toggle(r.id)}
                        aria-label={`Select ${r.name}`}
                      />
                    </td>
                    <td
                      className="px-4 py-3 font-medium text-slate-900 cursor-pointer"
                      onClick={() => navigate(`/routes/${r.id}`)}
                    >
                      {r.name}
                    </td>
                     <td className="px-4 py-3 text-slate-700">{r.origin}</td>
                     <td className="px-4 py-3 text-slate-700">{r.destination}</td>
                     <td className="px-4 py-3 text-slate-700">
                       {r.origin_terminal_name || r.destination_terminal_name ? (
                         <div className="flex flex-col gap-0.5">
                           <span>{r.origin_terminal_name || 'Origin: Missing'}</span>
                           <span className="text-xs text-slate-400">↓</span>
                           <span>{r.destination_terminal_name || 'Destination: Missing'}</span>
                         </div>
                       ) : (
                         <span className="text-slate-400">Not configured</span>
                       )}
                     </td>
                     <td className="px-4 py-3 text-slate-700">
                       {r.operators?.length > 0
                         ? r.operators.map((op) => op.operator_name).join(", ")
                         : "—"}
                     </td>
                     <td className="px-4 py-3 text-right">
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8">
                             <MoreVertical className="h-4 w-4" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => navigate(`/routes/${r.id}`)}>
                             View details
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => openEdit(r)}>
                             Edit
                           </DropdownMenuItem>
                           <DropdownMenuItem
                             onClick={() => {
                               setEditingTerminals(r);
                               setSelectedOriginTerminalId(r.origin_terminal_id || "");
                               setSelectedDestinationTerminalId(r.destination_terminal_id || "");
                               setTerminalDialogOpen(true);
                             }}
                           >
                             {r.origin_terminal_id && r.destination_terminal_id ? 'Configure terminals' : 'Set terminals'}
                           </DropdownMenuItem>
                           <DropdownMenuItem
                             onClick={() => {
                               setEditingTerminals(r);
                               refreshGeometry.mutate(r.id, {
                                 onSuccess: () => {
                                   toast.success('Road route refreshed successfully.');
                                   refetch();
                                 },
                                 onError: () => {
                                   toast.error('Unable to generate road route. Please verify the terminal coordinates and try again.');
                                 },
                               });
                             }}
                           >
                             Refresh road route
                           </DropdownMenuItem>
                           <DropdownMenuItem
                             className="text-red-600"
                             onClick={() => setDeleteId(r.id)}
                           >
                             <Trash2 className="mr-2 h-4 w-4" />
                             Delete
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <BulkConfirmDialog
        open={bulkOpen}
        onOpenChange={(open) => {
          setBulkOpen(open);
        }}
        onConfirm={handleBulkDelete}
        loading={bulkLoading}
        title={`Delete ${selectedRouteNames.length} route${selectedRouteNames.length !== 1 ? "s" : ""}?`}
        description="The selected routes will be permanently deleted. Routes with existing trips may be rejected by the backend."
        confirmLabel="Delete"
        selectedNames={selectedRouteNames}
      />

      <Dialog open={terminalDialogOpen} onOpenChange={(open) => { if (!open) { setTerminalDialogOpen(false); setEditingTerminals(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Terminals</DialogTitle>
            <DialogDescription>
              Set the origin and destination terminals for this route. Saving will also attempt to generate the road route.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Origin Terminal</Label>
              <select
                value={selectedOriginTerminalId}
                onChange={(e) => setSelectedOriginTerminalId(e.target.value)}
                className="w-full rounded-md border border-slate-200 p-2"
              >
                <option value="">Select origin terminal</option>
                {terminals?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.city ? `(${t.city})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Destination Terminal</Label>
              <select
                value={selectedDestinationTerminalId}
                onChange={(e) => setSelectedDestinationTerminalId(e.target.value)}
                className="w-full rounded-md border border-slate-200 p-2"
              >
                <option value="">Select destination terminal</option>
                {terminals?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.city ? `(${t.city})` : ''}
                  </option>
                ))}
              </select>
              {selectedOriginTerminalId === selectedDestinationTerminalId && selectedOriginTerminalId !== "" && (
                <p className="text-xs text-red-600">Origin and destination must be different terminals.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTerminalDialogOpen(false)} disabled={terminalSaving}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!editingTerminals) return;
                if (selectedOriginTerminalId === selectedDestinationTerminalId && selectedOriginTerminalId !== "") return;
                setTerminalSaving(true);
                try {
                  await updateRoute.mutateAsync({
                    id: editingTerminals.id,
                    body: {
                      origin_terminal_id: selectedOriginTerminalId || null,
                      destination_terminal_id: selectedDestinationTerminalId || null,
                    },
                  });
                  const result = await refreshGeometry.mutateAsync(editingTerminals.id);
                  toast.success(
                    `Road route generated successfully. Distance: ${result.distance_km?.toFixed(1) ?? '—'} km, ` +
                    `Coordinates: ${result.coordinate_count}, Stops: ${result.stop_count}`
                  );
                  setTerminalDialogOpen(false);
                  setEditingTerminals(null);
                  refetch();
                } catch {
                  toast.error('Unable to generate road route. Please verify the terminal coordinates and try again.');
                } finally {
                  setTerminalSaving(false);
                }
              }}
              disabled={terminalSaving || (selectedOriginTerminalId === selectedDestinationTerminalId && selectedOriginTerminalId !== "")}
            >
              {terminalSaving ? 'Generating...' : 'Save & Generate Road Route'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete route"
        description="This action cannot be undone. Are you sure?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteRoute.isPending}
      />

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditing(null); setErrors({}); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Route" : "Add Route"}</DialogTitle>
            <DialogDescription>{editing ? "Update route details below." : "Enter route details below."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Route Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Calamba - Alabang"
              />
              {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="origin">Origin</Label>
              <Input
                id="origin"
                value={form.origin}
                onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                placeholder="e.g. Calamba"
              />
              {errors.origin && <p className="text-xs text-red-600">{errors.origin}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                value={form.destination}
                onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                placeholder="e.g. Alabang"
              />
              {errors.destination && <p className="text-xs text-red-600">{errors.destination}</p>}
            </div>

            <div className="space-y-2">
              <Label>Assigned Operators</Label>
              {!operators || operators.length === 0 ? (
                <p className="text-xs text-slate-500">No operators available.</p>
              ) : (
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-slate-200 p-2">
                  {operators.map((op) => (
                    <label key={op.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300"
                        checked={selectedOperatorIds.includes(op.id)}
                        onChange={(e) =>
                          setSelectedOperatorIds((prev) =>
                            e.target.checked ? [...prev, op.id] : prev.filter((id) => id !== op.id),
                          )
                        }
                      />
                      <span className="text-slate-700">{op.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={doSave} disabled={submitting}>
              {submitting ? "Saving..." : editing ? "Save changes" : "Create route"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
