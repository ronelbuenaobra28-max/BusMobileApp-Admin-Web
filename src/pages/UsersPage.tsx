"use client";

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MoreVertical } from "lucide-react";
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
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { useUsers } from "@/lib/api-hooks";
import type { User } from "@/types";

const ROLE_FILTERS = [
  { value: "", label: "All" },
  { value: "passenger", label: "Passenger" },
  { value: "driver", label: "Driver" },
  { value: "admin", label: "Admin" },
];

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

export default function UsersPage() {
  const { data: users, isLoading, error, refetch } = useUsers();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const filtered = useMemo(() => {
    if (!users) return [];
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        !term ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.contact_number && u.contact_number.toLowerCase().includes(term)) ||
        u.id.toLowerCase().includes(term);
      const matchesRole = !roleFilter || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const formatDate = (value: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFullName = (u: User) => {
    const name = `${u.first_name} ${u.last_name}`.trim();
    return name || "—";
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        description="Manage and monitor registered BusMobileApp user accounts."
      />

      <Card>
        <div className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search users..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_FILTERS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            Failed to load users.
            <Button variant="ghost" size="sm" className="ml-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <EmptyState
            title="No users found"
            description={
              search || roleFilter
                ? "No users match your current search or filters."
                : "No user accounts have been registered yet."
            }
          />
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Registered</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const vBadge = VERIFICATION_BADGE[u.verification_status || "none"] ?? VERIFICATION_BADGE.none;
                  const rBadge = ROLE_BADGE[u.role] ?? { className: "border-transparent bg-slate-100 text-slate-700" };
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-slate-100 hover:bg-slate-50/50"
                    >
                      <td
                        className="px-4 py-3 font-medium text-slate-900 cursor-pointer"
                        onClick={() => navigate(`/users/${u.id}`)}
                      >
                        {getFullName(u)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{u.email}</td>
                      <td className="px-4 py-3 text-slate-700">{u.contact_number ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${rBadge.className}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${vBadge.className}`}>
                          {vBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/users/${u.id}`)}>
                              View details
                            </DropdownMenuItem>
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
    </div>
  );
}
