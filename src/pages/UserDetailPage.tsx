"use client";

import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader, Button, Card, Skeleton } from "@/components/ui";
import { useUser } from "@/lib/api-hooks";

const VERIFICATION_BADGE: Record<string, { className: string; label: string }> = {
  none: { className: "border-transparent bg-slate-100 text-slate-700", label: "Unverified" },
  pending: { className: "border-transparent bg-amber-100 text-amber-700", label: "Pending" },
  verified: { className: "border-transparent bg-emerald-100 text-emerald-700", label: "Verified" },
  rejected: { className: "border-transparent bg-red-100 text-red-700", label: "Rejected" },
};

const ROLE_BADGE: Record<string, { className: string }> = {
  passenger: { className: "border-transparent bg-sky-100 text-sky-700" },
  driver: { className: "border-transparent bg-violet-100 text-violet-700" },
  admin: { className: "border-transparent bg-amber-100 text-amber-700" },
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading, error } = useUser(id ?? "");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Card>
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <PageHeader title="User" description="User account details" />
        <Card>
          <div className="p-8 text-center text-sm text-slate-500">
            User not found.
          </div>
        </Card>
      </div>
    );
  }

  const fullName = `${user.first_name} ${user.last_name}`.trim() || "—";
  const vBadge = VERIFICATION_BADGE[user.verification_status || "none"] ?? VERIFICATION_BADGE.none;
  const rBadge = ROLE_BADGE[user.role] ?? { className: "border-transparent bg-slate-100 text-slate-700" };

  const formatDate = (value: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName}
        description={
          <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${rBadge.className}`}>
            {user.role}
          </span>
        }
        action={
          <Button variant="outline" onClick={() => navigate("/users")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Email</p>
            <p className="text-lg font-semibold text-slate-900">{user.email}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Contact</p>
            <p className="text-lg font-semibold text-slate-900">{user.contact_number ?? "—"}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Status</p>
            <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${vBadge.className}`}>
              {vBadge.label}
            </span>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Account Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">User ID</p>
              <p className="font-mono text-sm text-slate-900">{user.id}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Registered</p>
              <p className="text-sm text-slate-900">{formatDate(user.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Birthdate</p>
              <p className="text-sm text-slate-900">{user.birthdate ? formatDate(user.birthdate) : "—"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Gender</p>
              <p className="text-sm text-slate-900">{user.gender ? user.gender.replace("_", " ") : "—"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">ID Type</p>
              <p className="text-sm text-slate-900">{user.verification_id_type ? user.verification_id_type.replace("_", " ") : "—"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Terms Version</p>
              <p className="text-sm text-slate-900">{user.terms_version ?? "—"}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
