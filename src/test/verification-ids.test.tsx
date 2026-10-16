import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import VerificationIdsPage from "@/pages/VerificationIdsPage";
import type { VerificationSubmission } from "@/types";

type ListState = {
  data?: VerificationSubmission[];
  isLoading?: boolean;
  error?: Error | null;
};

let listState: ListState;
const listArgs: string[] = [];
const refetch = vi.fn();
const review = vi.fn();
const imageCalls: Array<{ userId: string; side: string; enabled: boolean }> = [];
let imageState: { data?: Blob; isLoading?: boolean; error?: Error | null };

vi.mock("@/lib/api-hooks", () => ({
  useVerificationSubmissions: (filter: string) => {
    listArgs.push(filter);
    return {
      data: listState.data,
      isLoading: listState.isLoading ?? false,
      isFetching: false,
      error: listState.error ?? null,
      refetch,
    };
  },
  useVerificationImage: (userId: string, side: string, enabled: boolean) => {
    imageCalls.push({ userId, side, enabled });
    return {
      data: enabled ? imageState.data : undefined,
      isLoading: enabled && (imageState.isLoading ?? false),
      error: enabled ? imageState.error ?? null : null,
      refetch: vi.fn(),
    };
  },
  useReviewVerification: () => ({ mutateAsync: review, isPending: false }),
}));

const submission: VerificationSubmission = {
  user_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  first_name: "Ana",
  last_name: "Cruz",
  email: "ana@example.com",
  verification_id_type: "senior_citizen",
  verification_status: "pending",
  has_front: true,
  has_back: true,
  submitted_at: "2026-10-14T08:00:00Z",
  reviewed_at: null,
  reviewed_by_email: null,
  rejection_reason: null,
};

function renderPage() {
  return render(
    <BrowserRouter>
      <VerificationIdsPage />
    </BrowserRouter>,
  );
}

describe("VerificationIdsPage", () => {
  beforeEach(() => {
    listState = {};
    listArgs.length = 0;
    imageCalls.length = 0;
    imageState = { data: new Blob(["img"], { type: "image/jpeg" }) };
    refetch.mockReset();
    review.mockReset().mockResolvedValue({});
    URL.createObjectURL = vi.fn(() => "blob:mock-id");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists pending submissions by default with passenger, ID type and submitted time", () => {
    listState = { data: [submission] };
    renderPage();
    expect(listArgs.at(-1)).toBe("pending");
    expect(screen.getByText("Ana Cruz")).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getByText("Senior Citizen")).toBeInTheDocument();
    expect(screen.getByText(new Date(submission.submitted_at!).toLocaleString())).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Pending" })).toBeInTheDocument();
  });

  it("switches the status filter", () => {
    listState = { data: [] };
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(listArgs.at(-1)).toBe("all");
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
  });

  it("shows a loading state", () => {
    listState = { isLoading: true };
    const { container } = renderPage();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(screen.queryByText("No IDs awaiting review")).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing is pending", () => {
    listState = { data: [] };
    renderPage();
    expect(screen.getByText("No IDs awaiting review")).toBeInTheDocument();
  });

  it("shows an error state with retry", () => {
    listState = { error: new Error("Admin access required") };
    renderPage();
    expect(screen.getByText("Failed to load verification IDs")).toBeInTheDocument();
    expect(screen.getByText("Admin access required")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Retry/ }));
    expect(refetch).toHaveBeenCalled();
  });

  it("opens the detail view with both images and enlarges one on click", () => {
    listState = { data: [submission] };
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(imageCalls).toEqual(
      expect.arrayContaining([
        { userId: submission.user_id, side: "front", enabled: true },
        { userId: submission.user_id, side: "back", enabled: true },
      ]),
    );
    expect(screen.getByAltText("Front of ID")).toHaveAttribute("src", "blob:mock-id");
    expect(screen.getByAltText("Back of ID")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Enlarge front of id" }));
    expect(screen.getByAltText("Front of ID (enlarged)")).toBeInTheDocument();
  });

  it("does not request a back image that was never uploaded", () => {
    listState = { data: [{ ...submission, has_back: false }] };
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(screen.getByText("No back image uploaded.")).toBeInTheDocument();
    expect(imageCalls.filter((c) => c.side === "back").every((c) => !c.enabled)).toBe(true);
  });

  it("shows an image error state", () => {
    imageState = { error: new Error("Image not found") };
    listState = { data: [submission] };
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(screen.getAllByText("Could not load this image.")).toHaveLength(2);
  });

  it("approves with the submission time it was shown", async () => {
    listState = { data: [submission] };
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() =>
      expect(review).toHaveBeenCalledWith({
        userId: submission.user_id,
        decision: "approve",
        submittedAt: submission.submitted_at,
        reason: undefined,
      }),
    );
  });

  it("rejects with a trimmed reason", async () => {
    listState = { data: [submission] };
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    fireEvent.change(screen.getByLabelText("Reason shown to the passenger (optional)"), {
      target: { value: "  Photo is blurry  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm rejection" }));
    await waitFor(() =>
      expect(review).toHaveBeenCalledWith({
        userId: submission.user_id,
        decision: "reject",
        submittedAt: submission.submitted_at,
        reason: "Photo is blurry",
      }),
    );
  });

  it("shows the server's error when a decision fails", async () => {
    review.mockRejectedValue(new Error("The passenger uploaded a new ID or it was already reviewed. Reload and try again."));
    listState = { data: [submission] };
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(await screen.findByText(/uploaded a new ID/)).toBeInTheDocument();
  });

  it("shows the outcome and no actions for a reviewed submission", () => {
    listState = {
      data: [{
        ...submission,
        verification_status: "rejected",
        reviewed_at: "2026-10-14T09:00:00Z",
        reviewed_by_email: "admin@example.com",
        rejection_reason: "ID has expired",
      }],
    };
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    expect(screen.getByText("Reason: ID has expired")).toBeInTheDocument();
    expect(screen.getByText(/by admin@example.com/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reject" })).not.toBeInTheDocument();
  });
});
