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
}: {
  stops: Stop[];
  onAddStop?: (lngLat: [number, number]) => void;
  onEditStop?: (stop: Stop) => void;
  selectedLocation?: { latitude: number; longitude: number; name?: string } | null;
  readOnly?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const selectedLocationRef = useRef(selectedLocation);
  selectedLocationRef.current = selectedLocation;

  const features = useMemo(() => {
    const pointFeatures = stops.map((stop) => ({
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
    }));
    const lineFeature =
      stops.length > 1
        ? {
            type: "Feature" as const,
            properties: {},
            geometry: {
              type: "LineString" as const,
              coordinates: stops
                .slice()
                .sort((a, b) => a.sequence - b.sequence)
                .map((s) => [s.longitude, s.latitude] as [number, number]),
            },
          }
        : null;
    return {
      type: "FeatureCollection" as const,
      features: [...pointFeatures, ...(lineFeature ? [lineFeature] : [])],
    };
  }, [stops]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const coords: [number, number][] = stops.map((s) => [s.longitude, s.latitude]);
    const bounds = buildBoundingBox(coords, 0.05);

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [
        (bounds[0][0] + bounds[1][0]) / 2,
        (bounds[0][1] + bounds[1][1]) / 2,
      ],
      zoom: 12,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("stops", {
        type: "geojson",
        data: features,
      });

      const lineExists = features.features.some(
        (f) => f.geometry.type === "LineString",
      );
      if (lineExists) {
        map.addLayer({
          id: "stops-line",
          type: "line",
          source: "stops",
          filter: ["==", "$type", "LineString"],
          paint: {
            "line-color": "#2563eb",
            "line-width": 4,
            "line-opacity": 0.7,
          },
        });
      }

      map.addLayer({
        id: "stops-points",
        type: "circle",
        source: "stops",
        filter: ["==", "$type", "Point"],
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
        id: "stops-labels",
        type: "symbol",
        source: "stops",
        filter: ["==", "$type", "Point"],
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

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      stops.forEach((stop) => {
        const el = document.createElement("div");
        el.className = "flex h-4 w-4 rounded-full border-2 border-white shadow";
        el.style.backgroundColor =
          stop.point_type === "origin"
            ? "#16a34a"
            : stop.point_type === "destination"
              ? "#dc2626"
              : stop.point_type === "checkpoint"
                ? "#f59e0b"
                : "#2563eb";
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([stop.longitude, stop.latitude])
          .addTo(map);
        marker.getElement().addEventListener("click", () => {
          onEditStop?.(stop);
        });
        markersRef.current.push(marker);
      });

      if (selectedLocationRef.current) {
        const selectedEl = document.createElement("div");
        selectedEl.className = "flex h-5 w-5 rounded-full border-2 border-white shadow";
        selectedEl.style.backgroundColor = "#dc2626";
        const selectedMarker = new maplibregl.Marker({ element: selectedEl })
          .setLngLat([
            selectedLocationRef.current.longitude,
            selectedLocationRef.current.latitude,
          ])
          .addTo(map);
        markersRef.current.push(selectedMarker);
      }
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource("stops") as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(features);
    }
    if (map.loaded() && stops.length > 0) {
      const bounds = buildBoundingBox(
        stops.map((s) => [s.longitude, s.latitude]),
        0.05,
      );
      map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
    }
  }, [features, stops]);

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
