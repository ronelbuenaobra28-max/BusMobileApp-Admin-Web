"use client";

import { useState } from "react";
import { Plus, Search, MoreVertical, Trash2 } from "lucide-react";
import {
  PageHeader,
  Button,
  Input,
  EmptyState,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
  ConfirmDialog,
  Skeleton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Label,
} from "@/components/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionToolbar } from "@/components/bulk-action-toolbar";
import { BulkConfirmDialog } from "@/components/bulk-confirm-dialog";
import { useTerminals, useCreateTerminal, useUpdateTerminal, useDeleteTerminal, useBulkDeleteTerminals } from "@/lib/api-hooks";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { toast } from "sonner";
import ListPageShell from "@/components/layout/ListPageShell";

const EMPTY_FORM = { name: "", address: "", city: "", lat: "", lng: "" };

export default function TerminalsPage() {
  const { data: terminals, isLoading, error, refetch } = useTerminals();
  const createTerminal = useCreateTerminal();
  const updateTerminal = useUpdateTerminal();
  const deleteTerminal = useDeleteTerminal();
  const bulkDeleteTerminals = useBulkDeleteTerminals();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; address?: string; city?: string; lat?: number; lng?: number } | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const filtered = terminals?.filter((t) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      t.name.toLowerCase().includes(term) ||
      (t.city || "").toLowerCase().includes(term) ||
      (t.address || "").toLowerCase().includes(term)
    );
  });

  const bulk = useBulkSelection(filtered ?? [], (t) => t.id);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (t: { id: string; name: string; address?: string; city?: string; lat?: number; lng?: number }) => {
    setEditing(t);
    setForm({
      name: t.name,
      address: t.address || "",
      city: t.city || "",
      lat: t.lat != null ? String(t.lat) : "",
      lng: t.lng != null ? String(t.lng) : "",
    });
    setDialogOpen(true);
  };

  const toNumber = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === "") return undefined;
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : undefined;
  };

  const doSave = async () => {
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      toast.error("Terminal name is required.");
      return;
    }
    setSubmitting(true);
    try {
      const lat = toNumber(form.lat);
      const lng = toNumber(form.lng);
      if ((form.lat.trim() !== "" && lat == null) || (form.lng.trim() !== "" && lng == null)) {
        toast.error("Enter valid coordinates.");
        return;
      }
      if (editing) {
        await updateTerminal.mutateAsync({
          id: editing.id,
          body: {
            name: trimmedName,
            address: form.address.trim() || undefined,
            city: form.city.trim() || undefined,
            ...(lat != null ? { lat } : {}),
            ...(lng != null ? { lng } : {}),
          },
        });
        toast.success("Terminal updated");
      } else {
        const id = crypto.randomUUID();
        await createTerminal.mutateAsync({
          id,
          name: trimmedName,
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          ...(lat != null ? { lat } : {}),
          ...(lng != null ? { lng } : {}),
        });
        toast.success("Terminal created");
      }
      setDialogOpen(false);
      setEditing(null);
    } catch {
      toast.error("Failed to save terminal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTerminal.mutateAsync(deleteId);
      toast.success("Terminal deleted");
    } catch {
      toast.error("Failed to delete terminal");
    } finally {
      setDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    const ids = Array.from(bulk.selectedIds);
    try {
      const result = await bulkDeleteTerminals.mutateAsync(ids);
      bulk.clear();
      if (result.blocked_count > 0) {
        toast.error(`${result.deleted_count} deleted. ${result.blocked_count} could not be deleted because they are referenced by routes.`);
      } else if (result.not_found_count > 0) {
        toast.success(`${result.deleted_count} deleted. ${result.not_found_count} were not found.`);
      } else {
        toast.success(`${result.deleted_count} terminal${result.deleted_count !== 1 ? "s" : ""} deleted`);
      }
      setBulkOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete terminals";
      toast.error(message);
    } finally {
      setBulkLoading(false);
    }
  };

  const selectedTerminalNames = (filtered ?? [])
    .filter((t) => bulk.isSelected(t.id))
    .map((t) => t.name);

  return (
    <>
      <ListPageShell
        header={
          <div className="space-y-3">
            <PageHeader
              title="Terminals"
              description="Manage bus terminals"
              action={
                <Button onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" /> Add Terminal
                </Button>
              }
            />
            {bulk.selectedCount > 0 && (
              <BulkActionToolbar
                selectedCount={bulk.selectedCount}
                loading={bulkLoading}
                actions={[
                  {
                    label: "Delete",
                    icon: <Trash2 className="h-4 w-4" />,
                    onClick: () => setBulkOpen(true),
                    variant: "destructive",
                  },
                ]}
              />
            )}
          </div>
        }
        filters={
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search terminals..."
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
              Failed to load terminals.
              <Button variant="ghost" size="sm" className="ml-2" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !error && filtered && filtered.length === 0 && (
            <EmptyState
              title="No terminals found"
              description="Create a terminal to get started."
              action={
                <Button onClick={openCreate} size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Add Terminal
                </Button>
              }
            />
          )}

          {!isLoading && !error && filtered && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="data-table w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-500">
                    <th className="px-4 py-3 w-10">
                      <Checkbox
                        checked={bulk.isAllSelected}
                        indeterminate={bulk.isIndeterminate}
                        onCheckedChange={bulk.toggleAll}
                        aria-label="Select all terminals"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium">ID</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Address</th>
                    <th className="px-4 py-3 font-medium">City</th>
                    <th className="px-4 py-3 font-medium">Latitude</th>
                    <th className="px-4 py-3 font-medium">Longitude</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr
                      key={t.id}
                      className={`border-b border-slate-100 hover:bg-slate-50/50 ${
                        bulk.isSelected(t.id) ? "bg-slate-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={bulk.isSelected(t.id)}
                          onCheckedChange={() => bulk.toggle(t.id)}
                          aria-label={`Select ${t.name}`}
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <span className="font-mono text-xs">{t.id.slice(0, 8)}...</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{t.name}</td>
                      <td className="px-4 py-3 text-slate-700">{t.address || "—"}</td>
                      <td className="px-4 py-3 text-slate-700">{t.city || "—"}</td>
                      <td className="px-4 py-3 text-slate-700">{t.lat != null ? String(t.lat) : "—"}</td>
                      <td className="px-4 py-3 text-slate-700">{t.lng != null ? String(t.lng) : "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(t)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setDeleteId(t.id)}
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
        </div>
      </ListPageShell>

      <BulkConfirmDialog
        open={bulkOpen}
        onOpenChange={(open) => {
          setBulkOpen(open);
        }}
        onConfirm={handleBulkDelete}
        loading={bulkLoading}
        title={`Delete ${selectedTerminalNames.length} terminal${selectedTerminalNames.length !== 1 ? "s" : ""}?`}
        description="The selected terminals will be permanently deleted. Terminals referenced by routes cannot be deleted."
        confirmLabel="Delete"
        selectedNames={selectedTerminalNames}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete terminal"
        description="This permanently removes the terminal. Are you sure?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteTerminal.isPending}
      />

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditing(null); setForm({ ...EMPTY_FORM }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Terminal" : "Add Terminal"}</DialogTitle>
            <DialogDescription>{editing ? "Update terminal details below." : "Enter terminal details below."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Terminal Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Manila Central Terminal"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="e.g. 123 Rizal Ave"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="e.g. Manila"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  value={form.lat}
                  onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                  placeholder="e.g. 14.5995"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  type="number"
                  value={form.lng}
                  onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                  placeholder="e.g. 120.9842"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={doSave} disabled={submitting}>
              {submitting ? "Saving..." : editing ? "Save changes" : "Create terminal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
