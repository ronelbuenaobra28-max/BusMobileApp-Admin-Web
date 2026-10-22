import { useEffect, useState } from "react";
import {
  PageHeader,
  EmptyState,
  ErrorState,
  Skeleton,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from "@/components/ui";
import {
  useReviewVerification,
  useVerificationImage,
  useVerificationSubmissions,
} from "@/lib/api-hooks";
import ListPageShell from "@/components/layout/ListPageShell";
import type { VerificationFilter, VerificationStatus, VerificationSubmission } from "@/types";

const ID_TYPES: Record<string, string> = {
  student: "Student",
  senior_citizen: "Senior Citizen",
  pwd: "PWD",
};

const FILTERS: { value: VerificationFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const REASON_MAX = 500;

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "Unknown");

const idType = (value: string | null) => (value ? ID_TYPES[value] ?? value : "—");

function StatusBadge({ status }: { status: VerificationStatus }) {
  if (status === "verified") return <Badge variant="success">Approved</Badge>;
  if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
  if (status === "pending") return <Badge variant="warning">Pending</Badge>;
  return <Badge variant="outline">None</Badge>;
}

/** One side of the ID, loaded with the admin's token and shown via an object URL. */
function IdImage({
  submission,
  side,
  onEnlarge,
}: {
  submission: VerificationSubmission;
  side: "front" | "back";
  onEnlarge: (url: string, label: string) => void;
}) {
  const available = side === "front" ? submission.has_front : submission.has_back;
  const { data, isLoading, error, refetch } = useVerificationImage(submission.user_id, side, available);
  const [url, setUrl] = useState<string | null>(null);
  const label = side === "front" ? "Front of ID" : "Back of ID";

  useEffect(() => {
    if (!data) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(data);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [data]);

  let body: React.ReactNode;
  if (!available) {
    body = (
      <p className="text-sm text-slate-500">
        {side === "front" ? "No front image on file." : "No back image uploaded."}
      </p>
    );
  } else if (isLoading) {
    body = <Skeleton className="h-40 w-full" />;
  } else if (error || !url) {
    body = (
      <div className="text-sm text-red-600">
        Could not load this image.
        <Button variant="ghost" size="sm" className="ml-2" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  } else {
    body = (
      <button
        type="button"
        className="block w-full overflow-hidden rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
        onClick={() => onEnlarge(url, label)}
        aria-label={`Enlarge ${label.toLowerCase()}`}
      >
        <img src={url} alt={label} className="h-40 w-full bg-slate-50 object-contain" />
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      {body}
    </div>
  );
}

function ReviewDialog({
  submission,
  onClose,
}: {
  submission: VerificationSubmission | null;
  onClose: () => void;
}) {
  const review = useReviewVerification();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enlarged, setEnlarged] = useState<{ url: string; label: string } | null>(null);

  const close = () => {
    setRejecting(false);
    setReason("");
    setError(null);
    setEnlarged(null);
    onClose();
  };

  const decide = async (decision: "approve" | "reject") => {
    if (!submission) return;
    setError(null);
    try {
      await review.mutateAsync({
        userId: submission.user_id,
        decision,
        submittedAt: submission.submitted_at,
        reason: decision === "reject" ? reason.trim() : undefined,
      });
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the decision.");
    }
  };

  const pending = submission?.verification_status === "pending";

  return (
    <>
      <Dialog open={submission !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-w-2xl">
          {submission && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {submission.first_name} {submission.last_name}
                </DialogTitle>
                <DialogDescription>
                  {submission.email} · {idType(submission.verification_id_type)} ID · submitted{" "}
                  {when(submission.submitted_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Status:</span>
                <StatusBadge status={submission.verification_status} />
                {submission.reviewed_at && (
                  <span className="text-xs text-slate-500">
                    by {submission.reviewed_by_email ?? "admin"} · {when(submission.reviewed_at)}
                  </span>
                )}
              </div>
              {submission.verification_status === "rejected" && submission.rejection_reason && (
                <p className="text-sm text-slate-700">Reason: {submission.rejection_reason}</p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <IdImage submission={submission} side="front" onEnlarge={(url, label) => setEnlarged({ url, label })} />
                <IdImage submission={submission} side="back" onEnlarge={(url, label) => setEnlarged({ url, label })} />
              </div>

              {pending && rejecting && (
                <div>
                  <Label htmlFor="reject-reason">Reason shown to the passenger (optional)</Label>
                  <Textarea
                    id="reject-reason"
                    value={reason}
                    maxLength={REASON_MAX}
                    placeholder="For example: the photo is blurry, or the ID has expired."
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <p className="mt-1 text-right text-xs text-slate-500">
                    {reason.length}/{REASON_MAX}
                  </p>
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <DialogFooter>
                {!pending ? (
                  <Button variant="outline" onClick={close}>
                    Close
                  </Button>
                ) : rejecting ? (
                  <>
                    <Button variant="outline" onClick={() => setRejecting(false)} disabled={review.isPending}>
                      Back
                    </Button>
                    <Button variant="destructive" onClick={() => decide("reject")} disabled={review.isPending}>
                      {review.isPending ? "Saving..." : "Confirm rejection"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setRejecting(true)} disabled={review.isPending}>
                      Reject
                    </Button>
                    <Button
                      onClick={() => decide("approve")}
                      disabled={review.isPending || !submission.has_front}
                    >
                      {review.isPending ? "Saving..." : "Approve"}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={enlarged !== null} onOpenChange={(open) => !open && setEnlarged(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{enlarged?.label}</DialogTitle>
          </DialogHeader>
          {enlarged && (
            <img src={enlarged.url} alt={`${enlarged.label} (enlarged)`} className="max-h-[80vh] w-full object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function VerificationIdsPage() {
  const [filter, setFilter] = useState<VerificationFilter>("pending");
  const [selected, setSelected] = useState<VerificationSubmission | null>(null);
  const { data, isLoading, error, refetch, isFetching } = useVerificationSubmissions(filter);
  const submissions = data ?? [];

  return (
    <ListPageShell
      header={
        <PageHeader
          title="Verification IDs"
          description="Student, senior citizen and PWD IDs uploaded by passengers. Approve an ID to verify the passenger, or reject it with a reason they will see in the app."
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "Refreshing..." : "Refresh"}
            </Button>
          }
        />
      }
      filters={
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? "default" : "outline"}
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
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

        {error && !isLoading && (
          <ErrorState
            title="Failed to load verification IDs"
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !error && submissions.length === 0 && (
          <EmptyState
            title={filter === "pending" ? "No IDs awaiting review" : "No verification IDs"}
            description={
              filter === "pending"
                ? "New uploads from passengers will appear here."
                : "No submissions match this filter."
            }
          />
        )}

        {!isLoading && !error && submissions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-4 py-3">Passenger</th>
                  <th className="px-4 py-3">ID Type</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.user_id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {s.first_name} {s.last_name}
                      </div>
                      <div className="text-xs text-slate-500">{s.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{idType(s.verification_id_type)}</td>
                    <td className="px-4 py-3 text-slate-700">{when(s.submitted_at)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.verification_status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelected(s)}>
                        {s.verification_status === "pending" ? "Review" : "View"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ReviewDialog submission={selected} onClose={() => setSelected(null)} />
    </ListPageShell>
  );
}
