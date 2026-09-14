"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminNotificationTest } from "@/lib/api-hooks";
import { toast } from "sonner";

export default function NotificationsPage() {
  const test = useAdminNotificationTest();
  const [title, setTitle] = useState("Test Notification");
  const [body, setBody] = useState("This is a test FCM notification.");

  const handleSend = async () => {
    try {
      const res = await test.mutateAsync({ title, body });
      if (res.success) {
        toast.success(
          `Notification sent to ${res.tokens_targeted} device(s). Message ID: ${res.message_id}`,
        );
      } else {
        toast.error("Notification failed to send.");
      }
    } catch {
      toast.error("Failed to send test notification.");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
        <p className="text-sm text-slate-500">Send test FCM notifications to all devices.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Test Notification</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Body</Label>
              <Input
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={test.isPending}>
              {test.isPending ? "Sending..." : "Send Notification"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
