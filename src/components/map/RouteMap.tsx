"use client";

import { useEffect, useRef, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { buildBoundingBox } from "@/lib/map-helpers";
import type { Stop } from "@/types";

function RouteMap({
  stops,
  onAddStop,
  onEditStop,
  readOnly = false,
  selectedLocation,
  routeGeometry,
}: {
  stops: Stop[];
  onAddStop?: (lngLat: [number, number]) => void;
  onEditStop?: (stop: Stop) => void;
  selectedLocation?: { latitude: number; longitude: number; name?: string } | null;
  routeGeometry?: { coordinates: [number, number][] } | null;
  readOnly?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const selectedMarkerRef = useRef<maplibregl.Marker | null>(null);
  const stopsRef = useRef(stops);
  stopsRef.current = stops;
  const routeGeometryRef = useRef(routeGeometry);
  routeGeometryRef.current = routeGeometry;
  const selectedLocationRef = useRef(selectedLocation);
  selectedLocationRef.current = selectedLocation;
  const onEditStopRef = useRef(onEditStop);
  onEditStopRef.current = onEditStop;
  const onAddStopRef = useRef(onAddStop);
  onAddStopRef.current = onAddStop;

  const stopFeatures = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: stops.map((stop) => ({
        type: "Feature" as const,
        properties: {
          id: stop.id,
          name: stop.name,
          point_type: stop.point_type,
          sequence: stop.sequence,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [stop.longitude, stop.latitude] as [number, number],
        },
      })),
    };
  }, [stops]);

  const routeFeature = useMemo(() => {
    if (!routeGeometry?.coordinates || routeGeometry.coordinates.length < 2) {
      return null;
    }
    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: routeGeometry.coordinates,
      },
    };
  }, [routeGeometry]);

  const selectedFeature = useMemo(() => {
    if (!selectedLocation) return null;
    return {
      type: "Feature" as const,
      properties: { name: selectedLocation.name ?? "Selected location" },
      geometry: {
        type: "Point" as const,
        coordinates: [selectedLocation.longitude, selectedLocation.latitude] as [number, number],
      },
    };
  }, [selectedLocation]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const currentStops = stopsRef.current;
    const currentRouteGeometry = routeGeometryRef.current;
    const currentSelectedLocation = selectedLocationRef.current;

    const allCoords: [number, number][] = [
      ...currentStops.map((s) => [s.longitude, s.latitude] as [number, number]),
      ...(currentRouteGeometry?.coordinates ?? []),
      ...(currentSelectedLocation
        ? [[currentSelectedLocation.longitude, currentSelectedLocation.latitude] as [number, number]]
        : []),
    ];
    const bounds = buildBoundingBox(allCoords, 0.05);

    const map = new maplibregl.Map({
      container,
      style: "https://tiles.openfreemap.org/styles/liberty",
      transformRequest: (url, resourceType) => {
        if (
          resourceType === "Tile" &&
          url.includes("tiles.openfreemap.org/planet/") &&
          !url.includes("/latest/")
        ) {
          return {
            url: url.replace(
              /tiles\.openfreemap\.org\/planet\/[^/]+\//,
              "tiles.openfreemap.org/planet/latest/",
            ),
          };
        }
        return { url };
      },
      center: [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2],
      zoom: 12,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("route-line", {
        type: "geojson",
        data: currentRouteGeometry?.coordinates && currentRouteGeometry.coordinates.length >= 2
          ? {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: currentRouteGeometry.coordinates,
              },
            }
          : { type: "FeatureCollection", features: [] },
      });

      map.addSource("saved-stops", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: currentStops.map((stop) => ({
            type: "Feature",
            properties: {
              id: stop.id,
              name: stop.name,
              point_type: stop.point_type,
              sequence: stop.sequence,
            },
            geometry: {
              type: "Point",
              coordinates: [stop.longitude, stop.latitude] as [number, number],
            },
          })),
        },
      });

      map.addSource("selected-location", {
        type: "geojson",
        data: currentSelectedLocation
          ? {
              type: "Feature",
              properties: { name: currentSelectedLocation.name ?? "Selected location" },
              geometry: {
                type: "Point",
                coordinates: [currentSelectedLocation.longitude, currentSelectedLocation.latitude] as [number, number],
              },
            }
          : { type: "FeatureCollection", features: [] },
      });

      if (currentRouteGeometry?.coordinates && currentRouteGeometry.coordinates.length >= 2) {
        map.addLayer({
          id: "route-line-layer",
          type: "line",
          source: "route-line",
          paint: {
            "line-color": "#2563eb",
            "line-width": 4,
            "line-opacity": 0.7,
          },
        });
      }

      map.addLayer({
        id: "saved-stops-points",
        type: "circle",
        source: "saved-stops",
        paint: {
          "circle-radius": 8,
          "circle-color": [
            "match",
            ["get", "point_type"],
            "origin",
            "#16a34a",
            "destination",
            "#dc2626",
            "checkpoint",
            "#f59e0b",
            "#2563eb",
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "saved-stops-labels",
        type: "symbol",
        source: "saved-stops",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-offset": [0, 1.4],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#0f172a",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        },
      });

      map.addLayer({
        id: "selected-location-point",
        type: "circle",
        source: "selected-location",
        paint: {
          "circle-radius": 10,
          "circle-color": "#dc2626",
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.on("click", "saved-stops-points", (e) => {
        const props = e.features?.[0]?.properties;
        if (!props) return;
        const stop = currentStops.find((s) => s.id === props.id);
        if (stop) onEditStopRef.current?.(stop);
      });

      if (currentSelectedLocation) {
        map.setCenter([currentSelectedLocation.longitude, currentSelectedLocation.latitude]);
        map.setZoom(14);
      } else if (currentStops.length > 0) {
        const bounds = buildBoundingBox(
          currentStops.map((s) => [s.longitude, s.latitude]),
          0.05,
        );
        map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
      }
    });

    return () => {
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.remove();
        selectedMarkerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const routeSource = map.getSource("route-line") as maplibregl.GeoJSONSource | undefined;
    if (routeSource) {
      routeSource.setData(routeFeature ?? { type: "FeatureCollection", features: [] });
    }

    const stopsSource = map.getSource("saved-stops") as maplibregl.GeoJSONSource | undefined;
    if (stopsSource) {
      stopsSource.setData(stopFeatures);
    }

    const selectedSource = map.getSource("selected-location") as maplibregl.GeoJSONSource | undefined;
    if (selectedSource) {
      selectedSource.setData(selectedFeature ?? { type: "FeatureCollection", features: [] });
    }
  }, [stopFeatures, routeFeature, selectedFeature]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedLocation) return;
    map.setCenter([selectedLocation.longitude, selectedLocation.latitude]);
    map.setZoom(14);
  }, [selectedLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !containerRef.current) return;
    const handler = (e: maplibregl.MapMouseEvent) => {
      if (readOnly) return;
      if (e.originalEvent.target !== containerRef.current) return;
      onAddStop?.([e.lngLat.lng, e.lngLat.lat]);
    };
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [onAddStop, readOnly]);

  return (
    <div
      ref={containerRef}
      className="h-[500px] w-full rounded-lg border border-slate-200 bg-slate-100"
    />
  );
}

export { RouteMap };
