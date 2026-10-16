import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: { access_token: "admin-token" } } }),
    },
  },
}));

import { apiFetchBlob } from "@/lib/api-client";

describe("apiFetchBlob", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the admin's bearer token, bypasses the HTTP cache and returns the bytes", async () => {
    const image = new Blob(["jpeg-bytes"], { type: "image/jpeg" });
    fetchMock.mockResolvedValue({ ok: true, status: 200, blob: () => Promise.resolve(image) });
    const blob = await apiFetchBlob("/api/admin/verification-ids/u1/image/front");
    expect(blob).toBe(image);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://127.0.0.1:8000/api/admin/verification-ids/u1/image/front");
    expect(init.headers).toEqual({ Authorization: "Bearer admin-token" });
    expect(init.cache).toBe("no-store");
  });

  it("throws the API's error detail with its status", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: "Image not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await expect(apiFetchBlob("/x")).rejects.toMatchObject({ message: "Image not found", status: 404 });
  });
});
