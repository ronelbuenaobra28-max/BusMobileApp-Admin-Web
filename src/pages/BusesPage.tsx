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
import { useBuses, useCreateBus, useUpdateBus, useRetireBus, useOperators } from "@/lib/api-hooks";
import { toast } from "sonner";

export default function BusesPage() {
  const { data: buses, isLoading, error } = useBuses();
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

  const filtered = buses?.filter((b) =>
    b.bus_number.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ bus_number: "", capacity: "", status: "active", operator_id: "" });
    setDialogOpen(true);
  };

  const openEdit = (b: {
    id: string;
    bus_number: string;
    capacity: number;
    status: string;
    operator_id: string | null;
  }) => {
    setEditing(b);
    setForm({
      bus_number: b.bus_number,
      capacity: String(b.capacity),
      status: b.status,
      operator_id: b.operator_id ?? "",
    });
    setDialogOpen(true);
  };

  const doSave = async () => {
    if (!form.bus_number.trim() || !form.capacity) return;
    setSubmitting(true);
    try {
      const body = {
        bus_number: form.bus_number,
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
      setDeleteId(null);
    } catch {
      toast.error("Failed to retire bus");
    }
  };

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
          <div className="p-4 text-sm text-red-600">Failed to load buses.</div>
        )}

        {!isLoading && !error && filtered && filtered.length === 0 && (
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

        {!isLoading && !error && filtered && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
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
                      className="border-b border-slate-100 hover:bg-slate-50/50"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {b.bus_number}
                      </td>
                      <td className="px-4 py-3 text-slate-900">{b.capacity}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${
                          b.status === "active" ? "border-transparent bg-emerald-100 text-emerald-700" :
                          b.status === "maintenance" ? "border-transparent bg-amber-100 text-amber-700" :
                          "border-transparent bg-slate-100 text-slate-700"
                        }`}>
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
                                <Trash2 className="mr-2 h-4 w-4" />
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

      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setDialogOpen(false);
            setEditing(null);
          }
        }}
        title={editing ? "Edit Bus" : "Add Bus"}
        description={editing ? "Update bus details below." : "Enter bus details below."}
        confirmLabel={editing ? "Save changes" : "Create bus"}
        variant="default"
        onConfirm={doSave}
        loading={submitting}
      />
    </div>
  );
}
