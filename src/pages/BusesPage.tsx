"use client";

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreVertical, PowerOff } from "lucide-react";
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
import { useBuses, useCreateBus, useUpdateBus, useRetireBus, useOperators } from "@/lib/api-hooks";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { toast } from "sonner";

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
  const { data: operators } = useOperators();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; bus_number: string; capacity: number; status: string; operator_id?: string | null } | null>(null);
  const [form, setForm] = useState({ bus_number: "", capacity: "", status: "active", operator_id: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ bus_number?: string; capacity?: string; operator_id?: string }>({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!buses) return [];
    const term = search.trim().toLowerCase();
    if (!term) return buses;
    return buses.filter((b) => b.bus_number.toLowerCase().includes(term));
  }, [buses, search]);

  const bulk = useBulkSelection(filtered, (b) => b.id);

  const openCreate = () => {
    setEditing(null);
    setForm({ bus_number: "", capacity: "", status: "active", operator_id: "" });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (b: {
    id: string;
    bus_number: string;
    capacity: number;
    status: string;
    operator_id?: string | null;
  }) => {
    setEditing(b);
    setForm({
      bus_number: b.bus_number,
      capacity: String(b.capacity),
      status: b.status,
      operator_id: b.operator_id ?? "",
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
      const body = {
        bus_number: form.bus_number.trim(),
        capacity: Number(form.capacity),
        status: form.status,
        operator_id: form.operator_id || null,
      };
      if (editing) {
        await updateBus.mutateAsync({ id: editing.id, body });
        toast.success("Bus updated");
      } else {
        await createBus.mutateAsync(body);
        toast.success("Bus created");
      }
      setDialogOpen(false);
      setEditing(null);
    } catch {
      toast.error("Failed to save bus");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetire = async () => {
    if (!deleteId) return;
    try {
      await retireBus.mutateAsync(deleteId);
      toast.success("Bus retired");
    } catch {
      toast.error("Failed to retire bus");
    } finally {
      setDeleteId(null);
    }
  };

  const handleBulkRetire = async () => {
    setBulkLoading(true);
    let success = 0;
    let failed = 0;

    for (const id of bulk.selectedIds) {
      try {
        await retireBus.mutateAsync(id);
        success++;
      } catch {
        failed++;
      }
    }

    bulk.clear();

    if (failed === 0) {
      toast.success(`${success} bus${success !== 1 ? "es" : ""} retired`);
      setBulkOpen(false);
    } else if (success === 0) {
      toast.error(`Failed to retire ${failed} bus${failed !== 1 ? "es" : ""}`);
    } else {
      toast.error(`${success} retired, ${failed} failed`);
    }
    setBulkLoading(false);
  };

  const selectedOperator = operators?.find((op) => op.id === form.operator_id);

  const selectedBusNumbers = filtered
    .filter((b) => bulk.isSelected(b.id))
    .map((b) => b.bus_number);

  return (
    <div className="space-y-4">
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
        onBulkDelete={() => setBulkOpen(true)}
        loading={bulkLoading}
        label="Retire"
      />

      <Card>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search buses..."
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
            <table className="w-full text-sm">
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
                          onClick={(e) => e.stopPropagation()}
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
                        <span
                          className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${
                            b.status === "active"
                              ? "border-transparent bg-emerald-100 text-emerald-700"
                              : b.status === "maintenance"
                                ? "border-transparent bg-amber-100 text-amber-700"
                                : "border-transparent bg-slate-100 text-slate-700"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{op?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
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
                            {b.status !== "retired" && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeleteId(b.id)}
                              >
                                <PowerOff className="mr-2 h-4 w-4" />
                                Retire
                              </DropdownMenuItem>
                            )}
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
      </Card>

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
        open={!!deleteId}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteId(null);
        }}
        title="Retire bus"
        description="This bus will be marked as retired. Are you sure?"
        confirmLabel="Retire"
        onConfirm={handleRetire}
        loading={retireBus.isPending}
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
    </div>
  );
}
