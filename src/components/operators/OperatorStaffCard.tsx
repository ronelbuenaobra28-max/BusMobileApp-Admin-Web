import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, KeyRound, Loader2, Trash2, UserPlus, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateOperatorStaff, useOperatorStaff, useRemoveOperatorStaff } from "@/lib/partner-hooks";
import type { OperatorStaff, OperatorStaffCreated } from "@/types";

const EMPTY = { first_name: "", last_name: "", email: "" };

/** Admin card on an operator's page: the company's Partner Portal sign-ins.
 *  New accounts get a temporary password that is shown here exactly once. */
export function OperatorStaffCard({ operatorId, operatorName }: { operatorId: string; operatorName: string }) {
  const { data: staff, isLoading, error } = useOperatorStaff(operatorId);
  const create = useCreateOperatorStaff(operatorId);
  const remove = useRemoveOperatorStaff(operatorId);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<OperatorStaffCreated | null>(null);
  const [copied, setCopied] = useState(false);
  const [removing, setRemoving] = useState<OperatorStaff | null>(null);

  const loginUrl = `${window.location.origin}/login`;

  const closeAdd = () => {
    setAddOpen(false);
    setForm(EMPTY);
    setFormError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const result = await create.mutateAsync({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
      });
      closeAdd();
      setCopied(false);
      setCreated(result);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create the account.");
    }
  };

  const copyDetails = async () => {
    if (!created) return;
    const text = [
      `SeatPass Partner Portal for ${operatorName}`,
      `Sign in: ${loginUrl}`,
      `Email: ${created.email}`,
      `Temporary password: ${created.temporary_password}`,
      "Please change your password after signing in (key icon, bottom left).",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      toast.error("Could not copy. Select the text and copy it instead.");
    }
  };

  const handleRemove = async () => {
    if (!removing) return;
    try {
      await remove.mutateAsync(removing.user_id);
      toast.success(`Removed ${removing.email ?? "the account"}`);
      setRemoving(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove the account.");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-lg font-semibold text-slate-900">Partner Portal access</CardTitle>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Staff accounts for {operatorName}. They can sign in to see their own bookings, sales, trips and fleet
            (view only), and nothing from other companies.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Add staff account
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : error ? (
          <p className="text-sm text-red-700">Could not load staff accounts: {error.message}</p>
        ) : !staff || staff.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-600">
            <Users className="h-5 w-5 text-slate-500" />
            No staff accounts yet. Add one so {operatorName} can see its bookings and sales.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {staff.map((s) => (
              <li key={s.user_id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {[s.first_name, s.last_name].filter(Boolean).join(" ") || "Staff"}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {s.email} · added {new Date(s.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-700 hover:bg-red-50 hover:text-red-800"
                  onClick={() => setRemoving(s)}
                  aria-label={`Remove ${s.email}`}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" /> Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {/* Add account */}
      <Dialog open={addOpen} onOpenChange={(open) => (open ? setAddOpen(true) : closeAdd())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add staff account</DialogTitle>
            <DialogDescription>
              Creates a Partner Portal sign-in for {operatorName}. You'll get a temporary password to send them.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {formError && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {formError}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="staff-first">First name</Label>
                <Input
                  id="staff-first"
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-last">Last name</Label>
                <Input
                  id="staff-last"
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email">Work email</Label>
              <Input
                id="staff-email"
                type="email"
                autoComplete="off"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeAdd} disabled={create.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* One-time credentials */}
      <Dialog open={!!created} onOpenChange={(open) => !open && setCreated(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Account created</DialogTitle>
            <DialogDescription>
              Send these sign-in details to {created?.first_name || "them"} privately. The temporary password is shown
              only once; if it's lost, remove the account and add it again.
            </DialogDescription>
          </DialogHeader>
          {created && (
            <dl className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <div>
                <dt className="text-slate-500">Sign in at</dt>
                <dd className="font-medium text-slate-900">{loginUrl}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="font-medium text-slate-900">{created.email}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Temporary password</dt>
                <dd className="flex items-center gap-2 font-mono text-base font-semibold text-slate-900">
                  <KeyRound aria-hidden className="h-4 w-4 text-primary-700" />
                  {created.temporary_password}
                </dd>
              </div>
            </dl>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={copyDetails}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied" : "Copy details"}
            </Button>
            <Button onClick={() => setCreated(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remove this staff account?"
        description={`${removing?.email ?? "This account"} will no longer be able to sign in to the Partner Portal. This deletes the sign-in.`}
        confirmLabel="Remove account"
        loading={remove.isPending}
        onConfirm={handleRemove}
      />
    </Card>
  );
}
