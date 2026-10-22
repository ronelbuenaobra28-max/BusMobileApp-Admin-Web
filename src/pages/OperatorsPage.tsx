"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreVertical, Power, PowerOff, Trash2, Upload, X, ImageIcon } from "lucide-react";
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
} from "@/components/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionToolbar } from "@/components/bulk-action-toolbar";
import { BulkConfirmDialog } from "@/components/bulk-confirm-dialog";
import { useOperators, useCreateOperator, useUpdateOperator, useDeactivateOperator, useDeleteOperator, useBulkDeleteOperators, useBulkDeactivateOperators } from "@/lib/api-hooks";
import {
  ACCEPTED_LOGO_TYPES,
  MAX_LOGO_SIZE_MB,
  removeOperatorLogo,
  uploadOperatorLogo,
  validateLogoFile,
} from "@/lib/operator-logo-storage";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { toast } from "sonner";
import ListPageShell from "@/components/layout/ListPageShell";

type OperatorLogoProps = {
  logoUrl: string | null | undefined;
  name: string;
  size?: string;
};

/** Generates a storage folder id for operators that do not exist yet. */
function newLogoFolderId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `op-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function OperatorLogo({ logoUrl, name, size = "h-8 w-8" }: OperatorLogoProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [logoUrl]);

  if (!logoUrl || failed) {
    return (
      <div
        className={`${size} flex shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-xs font-semibold uppercase text-slate-500`}
        aria-hidden="true"
      >
        {name.trim().charAt(0) || "?"}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`${name} logo`}
      className={`${size} shrink-0 rounded-md border border-slate-200 bg-white object-contain`}
      onError={() => setFailed(true)}
    />
  );
}

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
  const [editing, setEditing] = useState<{ id: string; name: string; logo_url: string | null } | null>(null);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [logoFolderId, setLogoFolderId] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null);
  const [activateId, setActivateId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const filtered = operators?.filter((op) =>
    op.name.toLowerCase().includes(search.toLowerCase()),
  );

  const bulk = useBulkSelection(filtered ?? [], (op) => op.id);

  const clearLogo = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setLogoFile(null);
    setLogoPreview(null);
    setLogoRemoved(false);
    setLogoError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const openCreate = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setEditing(null);
    setName("");
    setNameError("");
    setLogoFolderId(newLogoFolderId());
    setLogoFile(null);
    setLogoPreview(null);
    setLogoRemoved(false);
    setLogoError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setDialogOpen(true);
  };

  const openEdit = (op: { id: string; name: string; logo_url: string | null }) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setEditing(op);
    setName(op.name);
    setNameError("");
    setLogoFolderId(op.id);
    setLogoFile(null);
    setLogoPreview(op.logo_url ?? null);
    setLogoRemoved(false);
    setLogoError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  const handleLogoChange = (file: File | undefined) => {
    if (!file) return;
    const validationError = validateLogoFile(file);
    if (validationError) {
      setLogoError(validationError);
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const previewUrl = URL.createObjectURL(file);
    objectUrlRef.current = previewUrl;

    setLogoFile(file);
    setLogoPreview(previewUrl);
    setLogoRemoved(false);
    setLogoError("");
  };

  const handleRemoveLogo = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setLogoFile(null);
    setLogoPreview(null);
    setLogoRemoved(true);
    setLogoError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const doSave = async () => {
    if (!validateName(name)) return;

    let nextLogoUrl: string | null = logoRemoved ? null : (logoPreview ?? null);

    setSubmitting(true);
    try {
      if (logoFile) {
        nextLogoUrl = await uploadOperatorLogo(logoFolderId, logoFile);
      }

      if (editing) {
        await updateOp.mutateAsync({
          id: editing.id,
          body: { name: name.trim(), logo_url: nextLogoUrl },
        });

        const previousLogoUrl = editing.logo_url ?? null;
        if (previousLogoUrl && previousLogoUrl !== nextLogoUrl) {
          try {
            await removeOperatorLogo(previousLogoUrl);
          } catch {
            // Storage cleanup is best-effort; the DB value is already correct.
          }
        }
        toast.success("Operator updated");
      } else {
        await createOp.mutateAsync({ name: name.trim(), logo_url: nextLogoUrl });
        toast.success("Operator created");
      }
      setDialogOpen(false);
      setEditing(null);
      setName("");
      setNameError("");
      clearLogo();
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
    <>
      <ListPageShell
      header={
        <div className="space-y-3">
          <PageHeader
            title="Operators"
            description="Manage bus operators"
            action={
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" /> Add Operator
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
          )}
        </div>
      }
      filters={
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search operators..."
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
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600">
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
            <table className="data-table w-full text-sm">
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
                  <th className="px-4 py-3 w-12"></th>
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
                    <td className="px-4 py-3">
                      <OperatorLogo logoUrl={op.logo_url} name={op.name} />
                    </td>
                    <td
                      className="px-4 py-3 font-medium text-slate-900 cursor-pointer"
                      onClick={() => navigate(`/operators/${op.id}`)}
                    >
                      {op.name}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={op.active} />
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
      </div>
    </ListPageShell>

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

    <Dialog open={dialogOpen} onOpenChange={(open) => {
      if (!open) {
        setDialogOpen(false);
        setEditing(null);
        setName("");
        setNameError("");
        clearLogo();
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Operator" : "Add Operator"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update the operator name and logo below." : "Enter operator name and logo below."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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

          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Logo</span>
            <div className="flex items-center gap-3">
              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Operator logo preview"
                    className="h-16 w-16 rounded-md border border-slate-200 bg-white object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    aria-label="Remove logo"
                    className="absolute -right-2 -top-2 rounded-full border border-slate-200 bg-white p-1 text-slate-500 shadow-sm hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-slate-400"
                  aria-hidden="true"
                >
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}

              <div className="space-y-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {logoPreview ? "Replace" : "Upload"}
                </Button>
                <p className="text-xs text-slate-500">
                  PNG, JPG or WebP. Max {MAX_LOGO_SIZE_MB} MB.
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_LOGO_TYPES.join(",")}
              className="hidden"
              onChange={(e) => handleLogoChange(e.target.files?.[0])}
            />

            {logoError && (
              <p className="text-xs text-red-600">{logoError}</p>
            )}
          </div>
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
    </>
  );
}
