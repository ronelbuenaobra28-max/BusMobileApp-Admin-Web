"use client";

import { useState } from "react";
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
  ConfirmDialog,
  Skeleton,
} from "@/components/ui";
import {
  useDrivers,
  useCreateDriver,
  useUpdateDriver,
  useRemoveDriver,
} from "@/lib/api-hooks";
import { toast } from "sonner";

export default function DriversPage() {
  const { data: drivers, isLoading, error } = useDrivers();
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const removeDriver = useRemoveDriver();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; full_name: string; license_no: string; status: string } | null>(null);
  const [form, setForm] = useState({ full_name: "", license_no: "", status: "active" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = drivers?.filter((d) =>
    d.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ full_name: "", license_no: "", status: "active" });
    setDialogOpen(true);
  };

  const openEdit = (d: { id: string; full_name: string; license_no: string; status: string }) => {
    setEditing(d);
    setForm({ full_name: d.full_name, license_no: d.license_no, status: d.status });
    setDialogOpen(true);
  };

  const doSave = async () => {
    if (!form.full_name.trim() || !form.license_no.trim()) return;
    setSubmitting(true);
    try {
      if (editing) {
        await updateDriver.mutateAsync({
          id: editing.id,
          body: { full_name: form.full_name, license_no: form.license_no, status: form.status },
        });
        toast.success("Driver updated");
      } else {
        await createDriver.mutateAsync({
          full_name: form.full_name,
          license_no: form.license_no,
        });
        toast.success("Driver created");
      }
      setDialogOpen(false);
      setEditing(null);
    } catch {
      toast.error("Failed to save driver");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!deleteId) return;
    try {
      await removeDriver.mutateAsync(deleteId);
      toast.success("Driver removed");
      setDeleteId(null);
    } catch {
      toast.error("Failed to remove driver");
    }
  };

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
                    className="border-b border-slate-100 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{d.full_name}</td>
                    <td className="px-4 py-3 text-slate-700">{d.license_no}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${
                        d.status === "active" ? "border-transparent bg-emerald-100 text-emerald-700" : "border-transparent bg-slate-100 text-slate-700"
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

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteId(null);
        }}
        title="Remove driver"
        description="This driver will be removed from the system. Are you sure?"
        confirmLabel="Remove"
        onConfirm={handleRemove}
        loading={removeDriver.isPending}
      />

      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setDialogOpen(false);
            setEditing(null);
          }
        }}
        title={editing ? "Edit Driver" : "Add Driver"}
        description={editing ? "Update driver details below." : "Enter driver details below."}
        confirmLabel={editing ? "Save changes" : "Create driver"}
        variant="default"
        onConfirm={doSave}
        loading={submitting}
      />
    </div>
  );
}
