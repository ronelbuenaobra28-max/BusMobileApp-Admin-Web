"use client";

import { useState, useEffect } from "react";
import { PageHeader, Button, Input, Card, Skeleton } from "@/components/ui";
import { toast } from "sonner";
import { useSettings, useUpdateSetting } from "@/lib/api-hooks";

type SettingValue = {
  booking_hold_minutes: number;
  reminder_window_hours: number;
};

export default function SettingsPage() {
  const { data: settings, isLoading, error } = useSettings();
  const updateSetting = useUpdateSetting();
  const [values, setValues] = useState<SettingValue>({
    booking_hold_minutes: 5,
    reminder_window_hours: 24,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setValues({
        booking_hold_minutes: settings.booking_hold_minutes ?? 5,
        reminder_window_hours: settings.reminder_window_hours ?? 24,
      });
    }
  }, [settings]);

  const handleSave = async (key: keyof SettingValue, rawValue: string) => {
    const parsed = Number(rawValue);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      toast.error("Please enter a valid positive number");
      return;
    }

    setSaving(true);
    try {
      const result = await updateSetting.mutateAsync({ key, value: String(parsed) });
      setValues((current) => ({ ...current, [key]: result.value }));
      toast.success("Setting saved");
    } catch {
      toast.error("Failed to save setting");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Card>
          <Skeleton className="h-48 w-full" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Settings" description="Application configuration" />
        <Card>
          <div className="p-8 text-center text-sm text-red-600">Failed to load settings.</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description="Application configuration" />

      <Card>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Booking</h3>
            <p className="text-sm text-slate-500">Operational defaults for passenger bookings.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Booking Hold Duration</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="w-32"
                  value={String(values.booking_hold_minutes)}
                  onChange={(e) =>
                    setValues((current) => ({ ...current, booking_hold_minutes: Number(e.target.value) }))
                  }
                  disabled={saving}
                />
                <span className="text-sm text-slate-500">minutes</span>
              </div>
              <p className="text-xs text-slate-500">
                Pending bookings are auto-released after this duration.
              </p>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => handleSave("booking_hold_minutes", String(values.booking_hold_minutes))}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
            <p className="text-sm text-slate-500">Trip reminder scheduling.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Reminder Look-ahead Window</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="w-32"
                  value={String(values.reminder_window_hours)}
                  onChange={(e) =>
                    setValues((current) => ({ ...current, reminder_window_hours: Number(e.target.value) }))
                  }
                  disabled={saving}
                />
                <span className="text-sm text-slate-500">hours</span>
              </div>
              <p className="text-xs text-slate-500">
                Scans scheduled trips within this window for reminders.
              </p>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => handleSave("reminder_window_hours", String(values.reminder_window_hours))}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
