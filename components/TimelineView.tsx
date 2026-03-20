"use client";

import { useState, useMemo } from "react";
import type { TimelineEvent } from "@/lib/types";

interface TimelineViewProps {
  events: (TimelineEvent & { familyLine?: string })[];
}

const FAMILY_COLORS: Record<string, string> = {
  Dover: "var(--family-dover)",
  Houghton: "var(--family-houghton)",
  Jensen: "var(--family-jensen)",
  Adams: "var(--family-adams)",
  Lowe: "var(--family-lowe)",
  Other: "var(--text-low-emphasis)",
};

export default function TimelineView({ events }: TimelineViewProps) {
  const [selectedFamilies, setSelectedFamilies] = useState<Set<string>>(
    new Set(Object.keys(FAMILY_COLORS))
  );

  const families = useMemo(() => {
    const fams = new Set<string>();
    for (const e of events) {
      if (e.familyLine) fams.add(e.familyLine);
    }
    return [...fams].sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(
      (e) => !e.familyLine || selectedFamilies.has(e.familyLine)
    );
  }, [events, selectedFamilies]);

  const toggleFamily = (fam: string) => {
    setSelectedFamilies((prev) => {
      const next = new Set(prev);
      if (next.has(fam)) next.delete(fam);
      else next.add(fam);
      return next;
    });
  };

  // Group by era
  const eras = useMemo(() => {
    const groups: Record<string, typeof filteredEvents> = {};
    for (const e of filteredEvents) {
      const era = e.era || "Unknown";
      if (!groups[era]) groups[era] = [];
      groups[era].push(e);
    }
    return groups;
  }, [filteredEvents]);

  return (
    <div>
      {/* Filter bar — each button is 44px min, uses color+label */}
      <fieldset className="mb-8">
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
                  border: `1.5px solid ${isActive ? "var(--surface-border)" : "var(--surface-border)"}`,
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

      {/* Timeline */}
      <div role="list" aria-label="Timeline events">
        {Object.entries(eras).map(([era, eraEvents]) => (
          <section key={era} className="mb-10" aria-label={`${era} era`}>
            <h2
              className="mb-5 text-xl font-semibold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--action-primary)",
              }}
            >
              {era}
            </h2>
            <div
              className="relative pl-8"
              style={{ borderLeft: "2px solid var(--surface-border)", marginLeft: "0.5rem" }}
            >
              {eraEvents.map((event, i) => {
                const color = FAMILY_COLORS[event.familyLine || "Other"] || FAMILY_COLORS.Other;
                return (
                  <div
                    key={`${event.date}-${i}`}
                    className="relative mb-5"
                    role="listitem"
                  >
                    {/* Dot on the line */}
                    <div
                      className="absolute top-2"
                      style={{
                        left: "-37px",
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: `3px solid ${color}`,
                        background: "var(--surface-primary)",
                      }}
                      aria-hidden="true"
                    />
                    <div className="card">
                      <div className="flex flex-wrap items-start gap-2">
                        <span
                          className="text-base font-bold"
                          style={{ color }}
                        >
                          {event.date}
                        </span>
                        <span
                          className="badge"
                          style={{
                            background: "var(--surface-elevated)",
                            color: "var(--text-medium-emphasis)",
                          }}
                        >
                          {event.event}
                        </span>
                      </div>
                      <p className="mt-1 text-base">
                        <strong style={{ color: "var(--text-high-emphasis)" }}>
                          {event.persons}
                        </strong>
                        {event.location && (
                          <span style={{ color: "var(--text-medium-emphasis)" }}>
                            {" "}&middot; {event.location}
                          </span>
                        )}
                      </p>
                      {event.source && (
                        <p
                          className="mt-1 text-sm"
                          style={{ color: "var(--text-low-emphasis)" }}
                        >
                          Source: {event.source}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
