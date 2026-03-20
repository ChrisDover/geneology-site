"use client";

import { useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import type { LocationEvent } from "@/lib/types";

interface MigrationMapProps {
  locations: LocationEvent[];
}

/* Deuteranopia-safe, matching CSS tokens */
const FAMILY_COLORS: Record<string, string> = {
  Dover: "#d4a564",
  Houghton: "#5b9bd5",
  Jensen: "#2bafa0",
  Adams: "#c75b8a",
  Lowe: "#9b7ec9",
  Other: "#707070",
};

function createIcon(color: string) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #121212;box-shadow:0 0 8px ${color}80;" role="img"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export default function MigrationMap({ locations }: MigrationMapProps) {
  const [selectedFamilies, setSelectedFamilies] = useState<Set<string>>(
    new Set(Object.keys(FAMILY_COLORS))
  );

  const families = useMemo(() => {
    const fams = new Set<string>();
    for (const loc of locations) fams.add(loc.familyLine);
    return [...fams].sort();
  }, [locations]);

  const filtered = useMemo(
    () => locations.filter((l) => selectedFamilies.has(l.familyLine)),
    [locations, selectedFamilies]
  );

  const migrationPaths = useMemo(() => {
    const paths: Record<string, [number, number][]> = {};
    for (const loc of filtered) {
      const fam = loc.familyLine;
      if (!paths[fam]) paths[fam] = [];
      const last = paths[fam][paths[fam].length - 1];
      if (!last || last[0] !== loc.lat || last[1] !== loc.lng) {
        paths[fam].push([loc.lat, loc.lng]);
      }
    }
    return paths;
  }, [filtered]);

  const markers = useMemo(() => {
    const seen = new Map<string, LocationEvent & { people: string[] }>();
    for (const loc of filtered) {
      const key = `${loc.lat.toFixed(4)},${loc.lng.toFixed(4)}`;
      if (seen.has(key)) {
        const existing = seen.get(key)!;
        if (!existing.people.includes(loc.personName)) {
          existing.people.push(loc.personName);
        }
      } else {
        seen.set(key, { ...loc, people: [loc.personName] });
      }
    }
    return [...seen.values()];
  }, [filtered]);

  const toggleFamily = (fam: string) => {
    setSelectedFamilies((prev) => {
      const next = new Set(prev);
      if (next.has(fam)) next.delete(fam);
      else next.add(fam);
      return next;
    });
  };

  return (
    <div>
      {/* Filter bar */}
      <fieldset className="mb-5">
        <legend className="mb-3 text-base font-semibold" style={{ color: "var(--text-medium-emphasis)" }}>
          Filter by family line
        </legend>
        <div className="flex flex-wrap items-center gap-3" role="group">
          {families.map((fam) => {
            const isActive = selectedFamilies.has(fam);
            return (
              <button
                key={fam}
                onClick={() => toggleFamily(fam)}
                className="rounded-lg px-4 py-2 text-base font-medium transition-colors"
                style={{
                  minHeight: "44px",
                  background: isActive ? "var(--surface-elevated)" : "transparent",
                  border: "1.5px solid var(--surface-border)",
                  color: isActive ? "var(--text-high-emphasis)" : "var(--text-low-emphasis)",
                  opacity: isActive ? 1 : 0.6,
                }}
                aria-pressed={isActive}
                aria-label={`${fam} family: ${isActive ? "showing" : "hidden"}`}
              >
                <span className="family-indicator">
                  <span
                    className="family-dot"
                    style={{ background: FAMILY_COLORS[fam] || FAMILY_COLORS.Other }}
                    aria-hidden="true"
                  />
                  {fam}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div
        className="overflow-hidden rounded-xl"
        style={{
          height: "calc(100vh - 16rem)",
          border: "1px solid var(--surface-border)",
        }}
        role="application"
        aria-label="Interactive migration map showing family movements across continents"
      >
        <MapContainer
          center={[45, -30]}
          zoom={3}
          style={{ height: "100%", width: "100%", background: "#121212" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {Object.entries(migrationPaths).map(([fam, positions]) =>
            positions.length > 1 ? (
              <Polyline
                key={fam}
                positions={positions}
                pathOptions={{
                  color: FAMILY_COLORS[fam] || FAMILY_COLORS.Other,
                  weight: 2.5,
                  opacity: 0.7,
                  dashArray: "8, 4",
                }}
              />
            ) : null
          )}

          {markers.map((loc, i) => (
            <Marker
              key={i}
              position={[loc.lat, loc.lng]}
              icon={createIcon(
                FAMILY_COLORS[loc.familyLine] || FAMILY_COLORS.Other
              )}
            >
              <Popup>
                <div style={{ color: "#e0e0e0", minWidth: 180 }}>
                  <strong style={{ color: FAMILY_COLORS[loc.familyLine], fontSize: 15 }}>
                    {loc.place}
                  </strong>
                  <div style={{ marginTop: 6, fontSize: 14 }}>
                    {loc.people.map((name) => (
                      <div key={name}>{name}</div>
                    ))}
                  </div>
                  {loc.date && (
                    <div style={{ marginTop: 6, fontSize: 13, color: "#a0a0a0" }}>
                      {loc.eventType}: {loc.date}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
