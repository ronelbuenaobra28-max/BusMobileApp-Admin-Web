"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">
          Admin preferences and application configuration.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            Settings are not yet configurable. Please update environment variables
            for API base URL and Supabase configuration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
