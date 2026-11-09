import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

type Session = { access_token: string; user: { id: string } } | null;
let session: Session = null;
let authListener: ((event: string, s: Session) => void) | null = null;

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session } }),
      onAuthStateChange: (cb: (event: string, s: Session) => void) => {
        authListener = cb;
        return { data: { subscription: { unsubscribe() {} } } };
      },
      signOut: vi.fn(async () => {
        session = null;
      }),
    },
  },
}));

const asUser = (id: string): Session => ({ access_token: `t-${id}`, user: { id } });

let auth: ReturnType<typeof useAuth> | null = null;
function Grab() {
  auth = useAuth();
  return null;
}

function setup() {
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <Grab />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return client;
}

beforeEach(() => {
  session = asUser("company-a-staff");
  auth = null;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ id: session?.user.id, role: "operator" }), { status: 200 })),
  );
});

describe("cached API data between sign-ins", () => {
  it("is wiped on logout so the next person never sees it", async () => {
    const client = setup();
    await waitFor(() => expect(auth?.profile?.user_id).toBe("company-a-staff"));
    client.setQueryData(["partner", "overview"], { month_ticket_sales: 186750 });

    await act(() => auth!.logout());

    expect(client.getQueryData(["partner", "overview"])).toBeUndefined();
    expect(auth?.profile).toBeNull();
  });

  it("is wiped when a different user signs in", async () => {
    const client = setup();
    await waitFor(() => expect(auth?.profile?.user_id).toBe("company-a-staff"));
    client.setQueryData(["partner", "me"], { operator_name: "Company A" });

    session = asUser("company-b-staff");
    act(() => authListener?.("SIGNED_IN", session));

    expect(client.getQueryData(["partner", "me"])).toBeUndefined();
    await waitFor(() => expect(auth?.profile?.user_id).toBe("company-b-staff"));
  });

  it("is kept when the same user's token refreshes", async () => {
    const client = setup();
    await waitFor(() => expect(auth?.profile?.user_id).toBe("company-a-staff"));
    client.setQueryData(["partner", "me"], { operator_name: "Company A" });

    act(() => authListener?.("TOKEN_REFRESHED", asUser("company-a-staff")));

    expect(client.getQueryData(["partner", "me"])).toEqual({ operator_name: "Company A" });
  });
});
