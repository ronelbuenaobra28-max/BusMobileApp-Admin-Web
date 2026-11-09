import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { passwordProblem } from "@/lib/password-rules";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Lets the signed-in user replace their password. The current password is
 *  checked by the backend first, so an unlocked computer is not enough to
 *  take over the account. With `forced`, it can't be dismissed: operator
 *  staff use it to replace the temporary password an admin sent them. */
export function ChangePasswordDialog({
  open,
  onOpenChange,
  forced = false,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forced?: boolean;
  onChanged?: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setCurrent("");
    setPassword("");
    setConfirm("");
    setShow(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = passwordProblem(password);
    if (!current) {
      setError(forced ? "Enter the temporary password you signed in with." : "Enter your current password.");
      return;
    }
    if (problem) {
      setError(problem);
      return;
    }
    if (password !== confirm) {
      setError("The new passwords do not match.");
      return;
    }
    if (password === current) {
      setError("Choose a password different from your current one.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post("/api/auth/change-password", { current_password: current, new_password: password });
      toast.success("Password changed");
      reset();
      onChanged?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change the password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (forced) return;
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        hideClose={forced}
        onEscapeKeyDown={(e) => forced && e.preventDefault()}
        onInteractOutside={(e) => forced && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{forced ? "Set your own password" : "Change password"}</DialogTitle>
          <DialogDescription>
            {forced
              ? "You signed in with a temporary password from SeatPass. Choose your own to continue."
              : "Choose a new password for signing in to SeatPass."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="current-password">{forced ? "Temporary password" : "Current password"}</Label>
            <Input
              id="current-password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide passwords" : "Show passwords"}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              At least 8 characters, with uppercase and lowercase letters, a number and a symbol.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              maxLength={72}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            {!forced && (
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
