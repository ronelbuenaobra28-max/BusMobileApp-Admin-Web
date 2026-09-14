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
import { useRoutes, useCreateRoute, useUpdateRoute, useDeleteRoute } from "@/lib/api-hooks";
import { toast } from "sonner";

export default function RoutesPage() {
  const { data: routes, isLoading, error } = useRoutes();
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();
  const deleteRoute = useDeleteRoute();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; origin: string; destination: string } | null>(null);
  const [form, setForm] = useState({ name: "", origin: "", destination: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = routes?.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", origin: "", destination: "" });
    setDialogOpen(true);
  };

  const openEdit = (r: { id: string; name: string; origin: string; destination: string }) => {
    setEditing(r);
    setForm({ name: r.name, origin: r.origin, destination: r.destination });
    setDialogOpen(true);
  };

  const doSave = async () => {
    if (!form.name.trim() || !form.origin.trim() || !form.destination.trim()) return;
    setSubmitting(true);
    try {
      if (editing) {
        await updateRoute.mutateAsync({
          id: editing.id,
          body: { name: form.name, origin: form.origin, destination: form.destination },
        });
        toast.success("Route updated");
      } else {
        await createRoute.mutateAsync({
          name: form.name,
          origin: form.origin,
          destination: form.destination,
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
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete route");
    }
  };

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
          <div className="p-4 text-sm text-red-600">Failed to load routes.</div>
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
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Origin</th>
                  <th className="px-4 py-3 font-medium">Destination</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                    <td className="px-4 py-3 text-slate-700">{r.origin}</td>
                    <td className="px-4 py-3 text-slate-700">{r.destination}</td>
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

      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setDialogOpen(false);
            setEditing(null);
          }
        }}
        title={editing ? "Edit Route" : "Add Route"}
        description={editing ? "Update route details below." : "Enter route details below."}
        confirmLabel={editing ? "Save changes" : "Create route"}
        variant="default"
        onConfirm={doSave}
        loading={submitting}
      />
    </div>
  );
}
