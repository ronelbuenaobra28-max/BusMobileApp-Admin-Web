"use client";

import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AlertCircle, BarChart3, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, Ticket } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HIGHLIGHTS = [
  { icon: BarChart3, text: "Live reservations, revenue and fleet status" },
  { icon: Ticket, text: "Schedules, routes and booking passengers in one place" },
  { icon: ShieldCheck, text: "Verification ID reviews and payment reconciliation" },
];

export default function LoginPage() {
  const { login, profile, initialized, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in as an admin: leave the login page (as an element, not a
  // navigate() call during render).
  if (initialized && !loading && profile && profile.role === "admin") {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch {
      setError("Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel (large screens only). */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Decorative route line, kept in the lower-right corner clear of the text. */}
        <svg aria-hidden className="pointer-events-none absolute -bottom-10 -right-10 h-72 w-72 opacity-25" viewBox="0 0 400 400" fill="none">
          <path d="M40 320 C 140 300, 120 140, 220 140 S 330 80, 360 40" stroke="white" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
          <circle cx="40" cy="320" r="10" fill="white" />
          <circle cx="360" cy="40" r="10" fill="white" />
        </svg>
        <div className="relative flex items-center gap-3 animate-in fade-in-0 slide-in-from-top-2 duration-500 motion-reduce:animate-none">
          <img src="/seatpass-mark.png" alt="" className="h-11 w-11 rounded-xl shadow-lg" />
          <div>
            <p className="text-lg font-semibold">SeatPass</p>
            <p className="text-sm text-white/90">Admin console</p>
          </div>
        </div>
        <div className="relative space-y-8 animate-in fade-in-0 slide-in-from-bottom-3 duration-700 motion-reduce:animate-none">
          <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Run every trip, seat and payment from one place.
          </h2>
          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/95">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-inset ring-white/20">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/80">© {new Date().getFullYear()} SeatPass</p>
      </div>

      {/* Sign-in form. */}
      <div className="flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src="/seatpass-mark.png" alt="" className="h-10 w-10 rounded-xl" />
            <span className="text-lg font-semibold text-slate-900">SeatPass Admin</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1.5 text-sm text-slate-600">Sign in with your administrator account.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800 animate-in fade-in-0 slide-in-from-top-1 motion-reduce:animate-none"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="admin@example.com"
                  className="h-11 bg-white pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="h-11 bg-white pl-10 pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="h-11 w-full text-sm" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
