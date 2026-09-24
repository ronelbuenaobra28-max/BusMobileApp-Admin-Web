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
import {
  useDrivers,
  useCreateDriver,
  useUpdateDriver,
  useRemoveDriver,
  useUsers,
} from "@/lib/api-hooks";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { toast } from "sonner";

export default function DriversPage() {
  const { data: drivers, isLoading, error } = useDrivers();
  const { data: users } = useUsers();
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const removeDriver = useRemoveDriver();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; license_no: string; status: string } | null>(null);
  const [form, setForm] = useState({ user_id: "", license_no: "", status: "available" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const filtered = drivers?.filter((d) =>
    d.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  const bulk = useBulkSelection(filtered ?? [], (d) => d.id);

  const eligibleUsers = useMemo(() => {
    if (!users) return [];
    const driverIds = new Set((drivers ?? []).map((d) => d.user_id));
    return users.filter((u) => u.role === "driver" && !driverIds.has(u.id));
  }, [users, drivers]);

  const openCreate = () => {
    setEditing(null);
    setForm({ user_id: "", license_no: "", status: "available" });
    setDialogOpen(true);
  };

  const openEdit = (d: { id: string; license_no: string; status: string }) => {
    setEditing({ id: d.id, license_no: d.license_no, status: d.status });
    setForm({ user_id: "", license_no: d.license_no, status: d.status });
    setDialogOpen(true);
  };

  const doSave = async () => {
    if (!editing && !form.user_id) return;
    if (!form.license_no.trim()) return;
    setSubmitting(true);
    try {
      if (editing) {
        await updateDriver.mutateAsync({
          id: editing.id,
          body: { license_no: form.license_no, status: form.status },
        });
        toast.success("Driver updated");
      } else {
        await createDriver.mutateAsync({
          user_id: form.user_id,
          license_no: form.license_no,
        });
        toast.success("Driver created");
      }
      setDialogOpen(false);
      setEditing(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save driver";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!deleteId) return;
    try {
      await removeDriver.mutateAsync(deleteId);
      toast.success("Driver deactivated");
      setDeleteId(null);
    } catch {
      toast.error("Failed to deactivate driver");
    }
  };

  const handleBulkRemove = async () => {
    setBulkLoading(true);
    let success = 0;
    let failed = 0;

    for (const id of bulk.selectedIds) {
      try {
        await removeDriver.mutateAsync(id);
        success++;
      } catch {
        failed++;
      }
    }

    bulk.clear();

    if (failed === 0) {
      toast.success(`${success} driver${success !== 1 ? "s" : ""} deactivated`);
      setBulkOpen(false);
    } else if (success === 0) {
      toast.error(`Failed to deactivate ${failed} driver${failed !== 1 ? "s" : ""}`);
    } else {
      toast.error(`${success} deactivated, ${failed} failed`);
    }
    setBulkLoading(false);
  };

  const selectedDriverNames = (filtered ?? [])
    .filter((d) => bulk.isSelected(d.id))
    .map((d) => d.full_name);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Drivers"
        description="Manage fleet drivers"
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Driver
          </Button>
        }
      />

      <BulkActionToolbar
        selectedCount={bulk.selectedCount}
        onBulkDelete={() => setBulkOpen(true)}
        loading={bulkLoading}
        label="Deactivate"
      />

      <Card>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search drivers..."
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
          <div className="p-4 text-sm text-red-600">Failed to load drivers.</div>
        )}

        {!isLoading && !error && filtered && filtered.length === 0 && (
          <EmptyState
            title="No drivers found"
            description="Add a driver to get started."
            action={
              <Button onClick={openCreate} size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Driver
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
                      aria-label="Select all drivers"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">License No</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr
                    key={d.id}
                    className={`border-b border-slate-100 hover:bg-slate-50/50 ${
                      bulk.isSelected(d.id) ? "bg-slate-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={bulk.isSelected(d.id)}
                        onCheckedChange={() => bulk.toggle(d.id)}
                        aria-label={`Select ${d.full_name}`}
                      />
                    </td>
                    <td
                      className="px-4 py-3 font-medium text-slate-900 cursor-pointer"
                      onClick={() => navigate(`/drivers/${d.id}`)}
                    >
                      {d.full_name}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{d.license_no}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${
                        d.status === "available" ? "border-transparent bg-emerald-100 text-emerald-700" : "border-transparent bg-slate-100 text-slate-700"
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/drivers/${d.id}`)}>
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(d)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteId(d.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
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
        onConfirm={handleBulkRemove}
        loading={bulkLoading}
        title={`Deactivate ${selectedDriverNames.length} driver${selectedDriverNames.length !== 1 ? "s" : ""}?`}
        description="The selected drivers will be deactivated and removed from active scheduling."
        confirmLabel="Deactivate"
        selectedNames={selectedDriverNames}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteId(null);
        }}
        title="Deactivate driver"
        description="This driver will be deactivated and removed from active scheduling. Are you sure?"
        confirmLabel="Deactivate"
        onConfirm={handleRemove}
        loading={removeDriver.isPending}
      />

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditing(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Driver" : "Add Driver"}</DialogTitle>
            <DialogDescription>{editing ? "Update driver details below." : "Select a user account and enter the driver's license number."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <div className="space-y-1">
                <Label htmlFor="user_id">User Account</Label>
                <select
                  id="user_id"
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm"
                  value={form.user_id}
                  onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
                >
                  <option value="">Select a driver account...</option>
                  {eligibleUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} — {u.email}
                    </option>
                  ))}
                </select>
                {eligibleUsers.length === 0 && (
                  <p className="text-xs text-slate-500">No eligible driver accounts available.</p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="license_no">License No</Label>
              <Input
                id="license_no"
                value={form.license_no}
                onChange={(e) => setForm((f) => ({ ...f, license_no: e.target.value }))}
                placeholder="e.g. DL-12345"
              />
            </div>

            {editing && (
              <div className="space-y-1">
                <Label htmlFor="status">Status</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="available">Available</option>
                  <option value="on_trip">On Trip</option>
                  <option value="off_duty">Off Duty</option>
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={doSave} disabled={submitting}>
              {submitting ? "Saving..." : editing ? "Save changes" : "Create driver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
