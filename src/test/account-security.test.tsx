import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { passwordProblem } from "@/lib/password-rules";

const post = vi.fn();
const refreshProfile = vi.fn(async () => {});
const logout = vi.fn(async () => {});

vi.mock("@/lib/api-client", () => ({ api: { post: (...args: unknown[]) => post(...args) } }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ refreshProfile, logout }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  post.mockReset();
  refreshProfile.mockClear();
  logout.mockClear();
});

describe("password rule", () => {
  it("matches the mobile sign-up rule", () => {
    expect(passwordProblem("short1!")).toMatch(/8 characters/);
    expect(passwordProblem("alllowercase1!")).toMatch(/uppercase/);
    expect(passwordProblem("NoNumbers!!")).toMatch(/number/);
    expect(passwordProblem("NoSymbols123")).toMatch(/symbol/);
    expect(passwordProblem("Good-Passw0rd")).toBeNull();
  });
});

describe("sign-in code step", () => {
  it("emails a code once, then verifies it and loads the profile", async () => {
    post.mockImplementation(async (path: string) =>
      path.endsWith("/request")
        ? { sent: true, verified: false, email_hint: "r***@seatpass.ph", resend_after_seconds: 60 }
        : { verified: true },
    );
    const { LoginCodeStep } = await import("@/components/auth/LoginCodeStep");
    render(<LoginCodeStep emailHint={null} />);

    expect(await screen.findByText(/r\*\*\*@seatpass\.ph/)).toBeInTheDocument();
    expect(post).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /Resend code in/ })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Sign-in code"), { target: { value: "48a29 13" } });
    expect(screen.getByLabelText("Sign-in code")).toHaveValue("482913");
    fireEvent.click(screen.getByRole("button", { name: "Verify and sign in" }));

    await waitFor(() => expect(post).toHaveBeenCalledWith("/api/auth/login-code/verify", { code: "482913" }));
    await waitFor(() => expect(refreshProfile).toHaveBeenCalled());
  });

  it("shows the server's message for a wrong code and clears the box", async () => {
    post.mockImplementation(async (path: string) => {
      if (path.endsWith("/request")) return { sent: true, verified: false, resend_after_seconds: 60 };
      throw new Error("Incorrect code. 4 attempts left.");
    });
    const { LoginCodeStep } = await import("@/components/auth/LoginCodeStep");
    render(<LoginCodeStep emailHint="r***@seatpass.ph" />);
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText("Sign-in code"), { target: { value: "111111" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify and sign in" }));
    expect(await screen.findByText("Incorrect code. 4 attempts left.")).toBeInTheDocument();
    expect(screen.getByLabelText("Sign-in code")).toHaveValue("");
    expect(refreshProfile).not.toHaveBeenCalled();
  });
});

describe("change password dialog", () => {
  async function renderDialog(props: { forced?: boolean } = {}) {
    const { ChangePasswordDialog } = await import("@/components/layout/ChangePasswordDialog");
    const onChanged = vi.fn();
    render(<ChangePasswordDialog open onOpenChange={() => {}} onChanged={onChanged} {...props} />);
    return onChanged;
  }

  const fill = (current: string, next: string, confirm = next) => {
    fireEvent.change(screen.getByLabelText(/Current password|Temporary password/), { target: { value: current } });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: next } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: confirm } });
    fireEvent.click(screen.getByRole("button", { name: "Save password" }));
  };

  it("needs the current password and a strong new one", async () => {
    await renderDialog();
    fill("", "Good-Passw0rd");
    expect(await screen.findByText("Enter your current password.")).toBeInTheDocument();
    fill("old-Passw0rd", "weakpass");
    expect(await screen.findByRole("alert")).toHaveTextContent("Use both lowercase and uppercase letters.");
    expect(post).not.toHaveBeenCalled();
  });

  it("sends the current and new password to the backend", async () => {
    post.mockResolvedValue(undefined);
    const onChanged = await renderDialog();
    fill("old-Passw0rd", "Good-Passw0rd");
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/api/auth/change-password", {
        current_password: "old-Passw0rd",
        new_password: "Good-Passw0rd",
      }),
    );
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("can't be dismissed when staff must replace a temporary password", async () => {
    await renderDialog({ forced: true });
    expect(screen.getByText("Set your own password")).toBeInTheDocument();
    expect(screen.getByLabelText("Temporary password")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });
});
