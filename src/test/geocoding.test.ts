import { describe, it, expect, vi } from "vitest";

describe("searchLocations", () => {
  it("returns results for a valid query", async () => {
    vi.doMock("@/lib/geocoding/maptiler", () => ({
      searchLocations: vi.fn().mockResolvedValue([
        {
          id: "id-1",
          name: "Baguio Central Terminal",
          formattedAddress: "Baguio City, Benguet, Philippines",
          latitude: 16.415,
          longitude: 120.594,
          placeType: "place",
        },
        {
          id: "id-2",
          name: "Baguio City Bus Terminal",
          formattedAddress: "Baguio City, Benguet",
          latitude: 16.418,
          longitude: 120.597,
          placeType: "place",
        },
      ]),
    }));

    const { searchLocations } = await import("@/lib/geocoding/maptiler");
    const results = await searchLocations("Baguio Central Terminal", { limit: 6 });
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe("Baguio Central Terminal");
    expect(results[0].latitude).toBeCloseTo(16.415);
    expect(results[0].longitude).toBeCloseTo(120.594);
  });

  it("returns empty array for short queries", async () => {
    vi.doMock("@/lib/geocoding/maptiler", () => ({
      searchLocations: vi.fn().mockResolvedValue([]),
    }));

    const { searchLocations } = await import("@/lib/geocoding/maptiler");
    const results = await searchLocations("Ba", { limit: 6 });
    expect(results).toHaveLength(0);
  });

  it("throws when API key is missing", async () => {
    vi.doMock("@/lib/geocoding/maptiler", () => ({
      searchLocations: vi.fn().mockImplementation(() => {
        return Promise.reject(new Error("MapTiler API key is not configured."));
      }),
    }));

    const { searchLocations } = await import("@/lib/geocoding/maptiler");
    await expect(searchLocations("Baguio")).rejects.toThrow(
      "MapTiler API key is not configured.",
    );
  });

  it("throws on 401/403 responses", async () => {
    vi.doMock("@/lib/geocoding/maptiler", () => ({
      searchLocations: vi.fn().mockImplementation(() => {
        return Promise.reject(new Error("Location search authentication failed."));
      }),
    }));

    const { searchLocations } = await import("@/lib/geocoding/maptiler");
    await expect(searchLocations("Baguio")).rejects.toThrow(
      "Location search authentication failed.",
    );
  });

  it("throws on network failure", async () => {
    vi.doMock("@/lib/geocoding/maptiler", () => ({
      searchLocations: vi.fn().mockImplementation(() => {
        return Promise.reject(new Error("Location search is temporarily unavailable."));
      }),
    }));

    const { searchLocations } = await import("@/lib/geocoding/maptiler");
    await expect(searchLocations("Baguio")).rejects.toThrow(
      "Location search is temporarily unavailable.",
    );
  });

  it("returns empty array when features are missing", async () => {
    vi.doMock("@/lib/geocoding/maptiler", () => ({
      searchLocations: vi.fn().mockResolvedValue([]),
    }));

    const { searchLocations } = await import("@/lib/geocoding/maptiler");
    const results = await searchLocations("Baguio", { limit: 6 });
    expect(results).toHaveLength(0);
  });
});
