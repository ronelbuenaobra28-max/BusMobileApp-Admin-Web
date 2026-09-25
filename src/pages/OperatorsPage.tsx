"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreVertical, Power, PowerOff, Trash2 } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionToolbar } from "@/components/bulk-action-toolbar";
import { BulkConfirmDialog } from "@/components/bulk-confirm-dialog";
import { useOperators, useCreateOperator, useUpdateOperator, useDeactivateOperator, useDeleteOperator, useBulkDeleteOperators, useBulkDeactivateOperators } from "@/lib/api-hooks";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { toast } from "sonner";

export default function OperatorsPage() {
  const { data: operators, isLoading, error, refetch } = useOperators();
  const createOp = useCreateOperator();
  const updateOp = useUpdateOperator();
  const deactivateOp = useDeactivateOperator();
  const deleteOp = useDeleteOperator();
  const bulkDeleteOp = useBulkDeleteOperators();
  const bulkDeactivateOp = useBulkDeactivateOperators();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null);
  const [activateId, setActivateId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const filtered = operators?.filter((op) =>
    op.name.toLowerCase().includes(search.toLowerCase()),
  );

  const bulk = useBulkSelection(filtered ?? [], (op) => op.id);

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
    setOpenMenuId(null);
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

  const handlePermanentDelete = async () => {
    if (!permanentDeleteId) return;
    try {
      await deleteOp.mutateAsync(permanentDeleteId);
      toast.success("Operator deleted permanently");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete operator";
      toast.error(message);
    } finally {
      setPermanentDeleteId(null);
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

  const handleBulkDeactivate = async () => {
    setBulkLoading(true);
    const ids = Array.from(bulk.selectedIds);
    try {
      const result = await bulkDeactivateOp.mutateAsync(ids);
      bulk.clear();
      if (result.already_inactive_ids.length > 0) {
        toast.error(`${result.deactivated_count} deactivated. ${result.already_inactive_ids.length} were already inactive.`);
      } else if (result.not_found.length > 0) {
        toast.success(`${result.deactivated_count} deactivated. ${result.not_found.length} were not found.`);
      } else {
        toast.success(`${result.deactivated_count} operator${result.deactivated_count !== 1 ? "s" : ""} deactivated`);
      }
      setBulkOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to deactivate operators";
      toast.error(message);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    const ids = Array.from(bulk.selectedIds);
    try {
      const result = await bulkDeleteOp.mutateAsync(ids);
      bulk.clear();
      if (result.blocked_count > 0) {
        toast.error(`${result.deleted_count} deleted. ${result.blocked_count} could not be deleted because they are still assigned to buses or routes.`);
      } else if (result.not_found_count > 0) {
        toast.success(`${result.deleted_count} deleted. ${result.not_found_count} were not found.`);
      } else {
        toast.success(`${result.deleted_count} operator${result.deleted_count !== 1 ? "s" : ""} deleted`);
      }
      setBulkDeleteOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete operators";
      toast.error(message);
    } finally {
      setBulkLoading(false);
    }
  };

  const isNameValid = name.trim().length > 0;
  const canSubmit = isNameValid && !submitting;

  const selectedOperatorNames = (filtered ?? [])
    .filter((op) => bulk.isSelected(op.id))
    .map((op) => op.name);

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
            label: "Deactivate",
            icon: <PowerOff className="h-4 w-4" />,
            onClick: () => setBulkOpen(true),
          },
        ]}
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
                  <th className="px-4 py-3 w-10">
                    <Checkbox
                      checked={bulk.isAllSelected}
                      indeterminate={bulk.isIndeterminate}
                      onCheckedChange={bulk.toggleAll}
                      aria-label="Select all operators"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((op) => (
                  <tr
                    key={op.id}
                    className={`border-b border-slate-100 hover:bg-slate-50/50 ${
                      bulk.isSelected(op.id) ? "bg-slate-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={bulk.isSelected(op.id)}
                        onCheckedChange={() => bulk.toggle(op.id)}
                        aria-label={`Select ${op.name}`}
                      />
                    </td>
                    <td
                      className="px-4 py-3 font-medium text-slate-900 cursor-pointer"
                      onClick={() => navigate(`/operators/${op.id}`)}
                    >
                      {op.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${
                        op.active === "active" ? "border-transparent bg-emerald-100 text-emerald-700" : "border-transparent bg-slate-100 text-slate-700"
                      }`}>
                        {op.active}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu
                        open={openMenuId === op.id}
                        onOpenChange={(open) => setOpenMenuId(open ? op.id : null)}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              navigate(`/operators/${op.id}`);
                              setOpenMenuId(null);
                            }}
                          >
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              openEdit(op);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          {op.active === "active" ? (
                            <>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setDeleteId(op.id);
                                  setOpenMenuId(null);
                                }}
                              >
                                <PowerOff className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setPermanentDeleteId(op.id);
                                  setOpenMenuId(null);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <>
                              <DropdownMenuItem
                                className="text-emerald-600"
                                onClick={() => {
                                  setActivateId(op.id);
                                  setOpenMenuId(null);
                                }}
                              >
                                <Power className="mr-2 h-4 w-4" />
                                Activate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setPermanentDeleteId(op.id);
                                  setOpenMenuId(null);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
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

      <BulkConfirmDialog
        open={bulkOpen}
        onOpenChange={(open) => {
          setBulkOpen(open);
        }}
        onConfirm={handleBulkDeactivate}
        loading={bulkLoading}
        title={`Deactivate ${selectedOperatorNames.length} operator${selectedOperatorNames.length !== 1 ? "s" : ""}?`}
        description="The selected operators will be marked as inactive. This action can be reversed by activating them again."
        confirmLabel="Deactivate"
        selectedNames={selectedOperatorNames}
      />

      <BulkConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => {
          setBulkDeleteOpen(open);
        }}
        onConfirm={handleBulkDelete}
        loading={bulkLoading}
        title={`Delete ${selectedOperatorNames.length} operator${selectedOperatorNames.length !== 1 ? "s" : ""} permanently?`}
        description="Operators assigned to buses or routes cannot be deleted."
        confirmLabel="Delete permanently"
        selectedNames={selectedOperatorNames}
      />

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
        open={!!permanentDeleteId}
        onOpenChange={(open: boolean) => {
          if (!open) setPermanentDeleteId(null);
        }}
        title="Delete operator permanently"
        description="This permanently removes the operator. Operators assigned to buses or routes cannot be deleted."
        confirmLabel="Delete permanently"
        onConfirm={handlePermanentDelete}
        loading={deleteOp.isPending}
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

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditing(null); setName(""); setNameError(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Operator" : "Add Operator"}</DialogTitle>
            <DialogDescription>{editing ? "Update the operator name below." : "Enter the operator name below."}</DialogDescription>
          </DialogHeader>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={doSave} disabled={!canSubmit}>
              {submitting ? "Saving..." : editing ? "Save changes" : "Create operator"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
