"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreVertical, Power, PowerOff } from "lucide-react";
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
import { useOperators, useCreateOperator, useUpdateOperator, useDeactivateOperator } from "@/lib/api-hooks";
import { toast } from "sonner";

export default function OperatorsPage() {
  const { data: operators, isLoading, error, refetch } = useOperators();
  const createOp = useCreateOperator();
  const updateOp = useUpdateOperator();
  const deactivateOp = useDeactivateOperator();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activateId, setActivateId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = operators?.filter((op) =>
    op.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setEditing(null);
    setName("");
    setNameError("");
    setDialogOpen(true);
  };

  const openEdit = (op: { id: string; name: string }) => {
    setEditing(op);
    setName(op.name);
    setNameError("");
    setDialogOpen(true);
  };

  const validateName = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) {
      setNameError("Operator name is required.");
      return false;
    }
    if (trimmed.length < 2) {
      setNameError("Name must be at least 2 characters.");
      return false;
    }
    setNameError("");
    return true;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (nameError) {
      validateName(value);
    }
  };

  const doSave = async () => {
    if (!validateName(name)) return;
    setSubmitting(true);
    try {
      if (editing) {
        await updateOp.mutateAsync({ id: editing.id, body: { name: name.trim() } });
        toast.success("Operator updated");
      } else {
        await createOp.mutateAsync({ name: name.trim() });
        toast.success("Operator created");
      }
      setDialogOpen(false);
      setName("");
      setEditing(null);
      setNameError("");
    } catch {
      toast.error("Failed to save operator");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deleteId) return;
    try {
      await deactivateOp.mutateAsync(deleteId);
      toast.success("Operator deactivated");
    } catch {
      toast.error("Failed to deactivate operator");
    } finally {
      setDeleteId(null);
    }
  };

  const handleActivate = async () => {
    if (!activateId) return;
    try {
      await updateOp.mutateAsync({ id: activateId, body: { active: "active" } });
      toast.success("Operator activated");
    } catch {
      toast.error("Failed to activate operator");
    } finally {
      setActivateId(null);
    }
  };

  const isNameValid = name.trim().length > 0;
  const canSubmit = isNameValid && !submitting;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Operators"
        description="Manage bus operators"
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Operator
          </Button>
        }
      />

      <Card>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search operators..."
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
            Failed to load operators.
            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !error && filtered && filtered.length === 0 && (
          <EmptyState
            title="No operators found"
            description="Create an operator to get started."
            action={
              <Button onClick={openCreate} size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Operator
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
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((op) => (
                  <tr
                    key={op.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{op.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${
                        op.active === "active" ? "border-transparent bg-emerald-100 text-emerald-700" : "border-transparent bg-slate-100 text-slate-700"
                      }`}>
                        {op.active}
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
                          <DropdownMenuItem onClick={() => navigate(`/operators/${op.id}`)}>
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(op)}>
                            Edit
                          </DropdownMenuItem>
                          {op.active === "active" ? (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setDeleteId(op.id)}
                            >
                              <PowerOff className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-emerald-600"
                              onClick={() => setActivateId(op.id)}
                            >
                              <Power className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
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
        title="Deactivate operator"
        description="This operator will be marked as inactive. Are you sure?"
        confirmLabel="Deactivate"
        onConfirm={handleDeactivate}
        loading={deactivateOp.isPending}
      />

      <ConfirmDialog
        open={!!activateId}
        onOpenChange={(open: boolean) => {
          if (!open) setActivateId(null);
        }}
        title="Activate operator"
        description="This operator will be marked as active. Are you sure?"
        confirmLabel="Activate"
        onConfirm={handleActivate}
        loading={updateOp.isPending}
      />

      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setDialogOpen(false);
            setEditing(null);
            setName("");
            setNameError("");
          }
        }}
        title={editing ? "Edit Operator" : "Add Operator"}
        description={editing ? "Update the operator name below." : "Enter the operator name below."}
        confirmLabel={editing ? "Save changes" : "Create operator"}
        variant="default"
        onConfirm={doSave}
        loading={submitting || createOp.isPending || updateOp.isPending}
      >
        <div className="space-y-3">
          <Input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSubmit) {
                doSave();
              }
            }}
            placeholder="Operator name"
            autoFocus
          />
          {nameError && (
            <p className="text-xs text-red-600">{nameError}</p>
          )}
        </div>
      </ConfirmDialog>
    </div>
  );
}
