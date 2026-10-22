"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreVertical, PowerOff, Trash2 } from "lucide-react";
import {
  PageHeader,
  Button,
  Input,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ConfirmDialog,
  Skeleton,
} from "@/components/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionToolbar } from "@/components/bulk-action-toolbar";
import { BulkConfirmDialog } from "@/components/bulk-confirm-dialog";
import { useBuses, useCreateBus, useUpdateBus, useRetireBus, useDeleteBus, useBulkRetireBuses, useBulkDeleteBuses, useOperators } from "@/lib/api-hooks";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import {
  DEFAULT_NEW_BUS_LAYOUT,
  availableLayoutOptions,
  buildBusPayload,
  conflictMessage,
  describeLayout,
  isBusConflict,
  normalizeStoredLayout,
} from "@/lib/bus-form";
import type { BusLayoutValue } from "@/lib/bus-form";
import {
  formatSeatLayoutPreview,
  getSeatLayoutPreview,
} from "@/lib/seat-layout-preview";
import { toast } from "sonner";
import ListPageShell from "@/components/layout/ListPageShell";

const BUS_STATUSES = [
  { value: "active", label: "Active" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
];


export default function BusesPage() {
  const { data: buses, isLoading, error, refetch } = useBuses();
  const createBus = useCreateBus();
  const updateBus = useUpdateBus();
  const retireBus = useRetireBus();
  const deleteBus = useDeleteBus();
  const bulkRetireBuses = useBulkRetireBuses();
  const bulkDeleteBuses = useBulkDeleteBuses();
  const { data: operators } = useOperators();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; bus_number: string; capacity: number; status: string; operator_id?: string | null; seating_layout?: string | null } | null>(null);
  const [form, setForm] = useState({ bus_number: "", capacity: "", status: "active", operator_id: "", seating_layout: DEFAULT_NEW_BUS_LAYOUT as BusLayoutValue });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [retireId, setRetireId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ bus_number?: string; capacity?: string; operator_id?: string }>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!buses) return [];
    const term = search.trim().toLowerCase();
    if (!term) return buses;
    return buses.filter((b) => b.bus_number.toLowerCase().includes(term));
  }, [buses, search]);

  const bulk = useBulkSelection(filtered, (b) => b.id);

  const openCreate = () => {
    setEditing(null);
    setForm({
      bus_number: "",
      capacity: "",
      status: "active",
      operator_id: "",
      seating_layout: DEFAULT_NEW_BUS_LAYOUT,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (b: {
    id: string;
    bus_number: string;
    capacity: number;
    status: string;
    operator_id?: string | null;
    seating_layout?: string | null;
  }) => {
    // Preserve whatever the backend reports. A bus stored as 'legacy' (or null
    // from before the column existed) must keep that value unless the admin
    // explicitly chooses a new layout -- never silently convert it to 2+2.
    const stored = normalizeStoredLayout(b.seating_layout);
    setEditing(b);
    setForm({
      bus_number: b.bus_number,
      capacity: String(b.capacity),
      status: b.status,
      operator_id: b.operator_id ?? "",
      seating_layout: stored,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.bus_number.trim()) {
      next.bus_number = "Bus number is required.";
    }
    if (!form.capacity || Number(form.capacity) <= 0) {
      next.capacity = "Enter a valid capacity.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const doSave = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const body = buildBusPayload(form, editing);

      if (editing) {
        await updateBus.mutateAsync({ id: editing.id, body });
        toast.success("Bus updated");
      } else {
        await createBus.mutateAsync(body);
        toast.success("Bus created");
      }
      setDialogOpen(false);
      setEditing(null);
    } catch (error) {
      // 409 = layout change blocked by non-cancelled bookings. Keep the dialog
      // open and the current configuration so nothing is silently altered.
      if (isBusConflict(error)) {
        toast.error(conflictMessage(error));
      } else {
        toast.error("Failed to save bus");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetire = async () => {
    if (!retireId) return;
    try {
      await retireBus.mutateAsync(retireId);
      toast.success("Bus retired");
    } catch {
      toast.error("Failed to retire bus");
    } finally {
      setRetireId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBus.mutateAsync(deleteId);
      toast.success("Bus deleted permanently");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete bus";
      toast.error(message);
    } finally {
      setDeleteId(null);
    }
  };

  const handleBulkRetire = async () => {
    setBulkLoading(true);
    const ids = Array.from(bulk.selectedIds);
    try {
      const result = await bulkRetireBuses.mutateAsync(ids);
      bulk.clear();
      if (result.already_retired_ids.length > 0) {
        toast.error(`${result.retired_count} retired. ${result.already_retired_ids.length} were already retired.`);
      } else if (result.not_found.length > 0) {
        toast.success(`${result.retired_count} retired. ${result.not_found.length} were not found.`);
      } else {
        toast.success(`${result.retired_count} bus${result.retired_count !== 1 ? "es" : ""} retired`);
      }
      setBulkOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retire buses";
      toast.error(message);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    const ids = Array.from(bulk.selectedIds);
    try {
      const result = await bulkDeleteBuses.mutateAsync(ids);
      bulk.clear();
      if (result.blocked_count > 0) {
        toast.error(`${result.deleted_count} deleted. ${result.blocked_count} could not be deleted because they are referenced by existing trips.`);
      } else if (result.not_found.length > 0) {
        toast.success(`${result.deleted_count} deleted. ${result.not_found.length} were not found.`);
      } else {
        toast.success(`${result.deleted_count} bus${result.deleted_count !== 1 ? "es" : ""} deleted`);
      }
      setBulkDeleteOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete buses";
      toast.error(message);
    } finally {
      setBulkLoading(false);
    }
  };

  const selectedOperator = operators?.find((op) => op.id === form.operator_id);

  const selectedBusNumbers = filtered
    .filter((b) => bulk.isSelected(b.id))
    .map((b) => b.bus_number);

  return (
    <>
      <ListPageShell
      header={
        <div className="space-y-3">
          <PageHeader
            title="Buses"
            description="Manage fleet buses"
            action={
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" /> Add Bus
              </Button>
            }
          />
          <BulkActionToolbar
            selectedCount={bulk.selectedCount}
            loading={bulkLoading}
            actions={[
              {
                label: "Delete",
                icon: <Trash2 className="h-4 w-4" />,
                onClick: () => setBulkDeleteOpen(true),
                variant: "destructive",
              },
              {
                label: "Retire",
                icon: <PowerOff className="h-4 w-4" />,
                onClick: () => setBulkOpen(true),
              },
            ]}
          />
        </div>
      }
      filters={
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search buses..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      }
    >
      <div className="p-4">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600">
            Failed to load buses.
            <Button variant="ghost" size="sm" className="ml-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <EmptyState
            title="No buses found"
            description="Add a bus to get started."
            action={
              <Button onClick={openCreate} size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Bus
              </Button>
            }
          />
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-4 py-3 w-10">
                    <Checkbox
                      checked={bulk.isAllSelected}
                      indeterminate={bulk.isIndeterminate}
                      onCheckedChange={bulk.toggleAll}
                      aria-label="Select all buses"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">Bus #</th>
                  <th className="px-4 py-3 font-medium">Capacity</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Operator</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const op = operators?.find((o) => o.id === b.operator_id);
                  return (
                    <tr
                      key={b.id}
                      className={`border-b border-slate-100 hover:bg-slate-50/50 ${
                        bulk.isSelected(b.id) ? "bg-slate-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={bulk.isSelected(b.id)}
                          onCheckedChange={() => bulk.toggle(b.id)}
                          aria-label={`Select ${b.bus_number}`}
                        />
                      </td>
                      <td
                        className="px-4 py-3 font-medium text-slate-900 cursor-pointer"
                        onClick={() => navigate(`/buses/${b.id}`)}
                      >
                        {b.bus_number}
                      </td>
                      <td className="px-4 py-3 text-slate-900">{b.capacity}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-700">{op?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu
                          open={openMenuId === b.id}
                          onOpenChange={(open) => setOpenMenuId(open ? b.id : null)}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/buses/${b.id}`)}>
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(b)}>
                              Edit
                            </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setRetireId(b.id);
                              setOpenMenuId(null);
                            }}
                          >
                            <PowerOff className="mr-2 h-4 w-4" />
                            Retire
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setDeleteId(b.id);
                              setOpenMenuId(null);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ListPageShell>

    <BulkConfirmDialog
      open={bulkDeleteOpen}
      onOpenChange={(open) => {
        setBulkDeleteOpen(open);
      }}
      onConfirm={handleBulkDelete}
      loading={bulkLoading}
      title={`Delete ${selectedBusNumbers.length} bus${selectedBusNumbers.length !== 1 ? "es" : ""} permanently?`}
      description="Buses referenced by existing trips cannot be deleted."
      confirmLabel="Delete permanently"
      selectedNames={selectedBusNumbers}
    />

    <BulkConfirmDialog
      open={bulkOpen}
      onOpenChange={(open) => {
        setBulkOpen(open);
      }}
      onConfirm={handleBulkRetire}
      loading={bulkLoading}
      title={`Retire ${selectedBusNumbers.length} bus${selectedBusNumbers.length !== 1 ? "es" : ""}?`}
      description="The selected buses will be marked as retired and removed from active scheduling."
      confirmLabel="Retire"
      selectedNames={selectedBusNumbers}
    />

    <ConfirmDialog
      open={!!retireId}
      onOpenChange={(open: boolean) => {
        if (!open) setRetireId(null);
      }}
      title="Retire bus"
      description="This bus will be marked as retired and removed from active scheduling."
      confirmLabel="Retire"
      onConfirm={handleRetire}
      loading={retireBus.isPending}
    />

    <ConfirmDialog
      open={!!deleteId}
      onOpenChange={(open: boolean) => {
        if (!open) setDeleteId(null);
      }}
      title="Delete bus permanently"
      description="This permanently removes the bus. A bus referenced by existing trips cannot be deleted."
      confirmLabel="Delete permanently"
      onConfirm={handleDelete}
      loading={deleteBus.isPending}
    />

    <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditing(null); setErrors({}); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Bus" : "Add Bus"}</DialogTitle>
          <DialogDescription>{editing ? "Update bus details below." : "Enter bus details below."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="bus_number">Bus Number</Label>
            <Input
              id="bus_number"
              value={form.bus_number}
              onChange={(e) => setForm((f) => ({ ...f, bus_number: e.target.value }))}
              placeholder="e.g. HM-102"
            />
            {errors.bus_number && <p className="text-xs text-red-600">{errors.bus_number}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="operator_id">Operator</Label>
            <Select
              value={form.operator_id}
              onValueChange={(value) => setForm((f) => ({ ...f, operator_id: value === "__none" ? "" : value }))}
            >
              <SelectTrigger id="operator_id">
                <SelectValue placeholder={selectedOperator ? selectedOperator.name : "Select operator"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">None</SelectItem>
                {operators?.map((op) => (
                  <SelectItem key={op.id} value={op.id}>
                    {op.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              placeholder="e.g. 50"
            />
            {errors.capacity && <p className="text-xs text-red-600">{errors.capacity}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="seating_layout">Seating layout</Label>
            <Select
              value={form.seating_layout}
              onValueChange={(value) =>
                setForm((f) => ({ ...f, seating_layout: value as BusLayoutValue }))
              }
            >
              <SelectTrigger id="seating_layout">
                <SelectValue placeholder="Select seating layout" />
              </SelectTrigger>
              <SelectContent>
                {availableLayoutOptions(form.seating_layout).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">{describeLayout(form.seating_layout)}</p>
          </div>

          <SeatLayoutPreviewPanel
            capacity={Number(form.capacity)}
            layout={form.seating_layout}
          />

          <div className="space-y-1">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm((f) => ({ ...f, status: value }))}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {BUS_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={doSave} disabled={submitting}>
            {submitting ? "Saving..." : editing ? "Save changes" : "Create bus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

/**
 * Live seat-layout preview for the bus form.
 *
 * Purely a display aid: the backend remains the source of truth for real seat
 * positions (see `src/lib/seat-layout-preview.ts`).
 */
function SeatLayoutPreviewPanel({
  capacity,
  layout,
}: {
  capacity: number;
  layout: BusLayoutValue;
}) {
  const preview = getSeatLayoutPreview(capacity, layout);

  if (!preview.valid) {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs text-slate-500">
          Enter a capacity to preview the seat layout.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-700">
          Total seats: <span data-testid="preview-total">{preview.totalSeats}</span>
        </span>
        <span className="text-xs text-slate-500" data-testid="preview-summary">
          {formatSeatLayoutPreview(preview)}
        </span>
      </div>

      {/* Row-by-row seat arrangement: each dot is one seat, the gap is the aisle. */}
      <div className="mt-3 space-y-1" data-testid="preview-rows">
        {preview.rows.map((count, rowIndex) => {
          // The helper already knows how each row splits across the aisle,
          // including packed rear rows (5 -> 2+3, 6 -> 3+3).
          const left = preview.leftSeats[rowIndex] ?? Math.floor(count / 2);
          const right = count - left;
          return (
            <div key={rowIndex} className="flex items-center justify-center gap-2">
              {Array.from({ length: left }, (_, i) => (
                <span key={`l-${i}`} className="h-2.5 w-2.5 rounded-sm bg-slate-400" />
              ))}
              {right > 0 && left > 0 && <span className="w-4" aria-hidden="true" />}
              {Array.from({ length: right }, (_, i) => (
                <span key={`r-${i}`} className="h-2.5 w-2.5 rounded-sm bg-slate-400" />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
