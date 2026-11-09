import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, MailCheck } from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CodeSent {
  sent: boolean;
  verified: boolean;
  email_hint?: string | null;
  resend_after_seconds?: number;
}

/** Second sign-in step: the 6-digit code SeatPass emails after the password.
 *  Uses the same backend endpoints as the mobile app. */
export function LoginCodeStep({ emailHint }: { emailHint: string | null }) {
  const { refreshProfile, logout } = useAuth();
  const [code, setCode] = useState("");
  const [hint, setHint] = useState(emailHint);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const requested = useRef(false);

  const sendCode = async () => {
    setSending(true);
    setError(null);
    try {
      const result = await api.post<CodeSent>("/api/auth/login-code/request", {});
      if (result.verified) {
        await refreshProfile();
        return;
      }
      if (result.email_hint) setHint(result.email_hint);
      setCooldown(result.resend_after_seconds ?? 60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send your code. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // Send the first code once (StrictMode mounts twice in development).
  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    void sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      await api.post("/api/auth/login-code/verify", { code });
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code didn't work. Please try again.");
      setCode("");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
        <MailCheck className="h-5 w-5" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">Check your email</h1>
      <p className="mt-1.5 text-sm text-slate-600">
        We sent a 6-digit sign-in code to {hint ?? "your email address"}. It expires in a few minutes.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="login-code">Sign-in code</Label>
          <Input
            id="login-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            placeholder="000000"
            className="h-12 bg-white text-center font-mono text-xl tracking-[0.5em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </div>
        <Button type="submit" className="h-11 w-full text-sm" disabled={verifying || code.length !== 6}>
          {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {verifying ? "Checking..." : "Verify and sign in"}
        </Button>
      </form>

      <div className="mt-5 flex items-center justify-between text-sm">
        <button
          type="button"
          className="font-medium text-primary-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
          onClick={() => void sendCode()}
          disabled={sending || cooldown > 0}
        >
          {sending ? "Sending..." : cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
        <button type="button" className="text-slate-600 hover:underline" onClick={() => void logout()}>
          Use another account
        </button>
      </div>
    </div>
  );
}
