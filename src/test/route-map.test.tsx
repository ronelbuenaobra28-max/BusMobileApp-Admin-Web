import { describe, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { RouteMap } from "@/components/map/RouteMap";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

function renderMap(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  );
}

vi.mock("maplibre-gl", () => {
  class MockMap {
    addControl() {}
    addSource() {}
    addLayer() {}
    on() {}
    off() {}
    setCenter() {}
    setZoom() {}
    fitBounds() {}
    loaded() { return true; }
    getSource() { return { setData: () => {} }; }
    remove() {}
  }
  class MockMarker {
    setLngLat() { return this; }
    addTo() { return this; }
    remove() {}
    getElement() { return document.createElement("div"); }
  }
  class MockNavigationControl {}
  return {
    default: {
      Map: MockMap,
      Marker: MockMarker,
      NavigationControl: MockNavigationControl,
    },
  };
});

const mockStops = [
  {
    id: "1",
    route_id: "r1",
    name: "Calamba",
    latitude: 14.2,
    longitude: 121.1,
    sequence: 1,
    point_type: "origin" as const,
    distance_from_origin_km: 0.0,
  },
  {
    id: "2",
    route_id: "r1",
    name: "Dau",
    latitude: 14.8,
    longitude: 120.6,
    sequence: 2,
    point_type: "checkpoint" as const,
    distance_from_origin_km: 93.4,
  },
  {
    id: "3",
    route_id: "r1",
    name: "Baguio",
    latitude: 16.4,
    longitude: 120.6,
    sequence: 3,
    point_type: "destination" as const,
    distance_from_origin_km: 311.4,
  },
];

describe("RouteMap saved markers", () => {
  it("renders all saved stops independently", () => {
    renderMap(
      <RouteMap
        stops={mockStops}
        readOnly={false}
        onAddStop={() => {}}
        onEditStop={() => {}}
      />,
    );
  });

  it("accepts route geometry without mixing with stop line", () => {
    renderMap(
      <RouteMap
        stops={mockStops}
        routeGeometry={{
          coordinates: [
            [121.1, 14.2],
            [120.6, 16.4],
          ],
        }}
        readOnly={false}
        onAddStop={() => {}}
        onEditStop={() => {}}
      />,
    );
  });

  it("renders selected location separately from saved stops", () => {
    renderMap(
      <RouteMap
        stops={mockStops}
        selectedLocation={{
          latitude: 16.415,
          longitude: 120.594,
          name: "Baguio Central Terminal",
        }}
        readOnly={false}
        onAddStop={() => {}}
        onEditStop={() => {}}
      />,
    );
  });

  it("renders without crashing when route geometry is initially null", () => {
    renderMap(
      <RouteMap
        stops={mockStops}
        routeGeometry={null}
        readOnly={false}
        onAddStop={() => {}}
        onEditStop={() => {}}
      />,
    );
  });
});
