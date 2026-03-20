"use client";

import { useState, useMemo, useEffect } from "react";
import Fuse from "fuse.js";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { SearchEntry } from "@/lib/types";

interface SearchViewProps {
  entries: SearchEntry[];
}

const FAMILY_BADGE: Record<string, string> = {
  Dover: "badge-dover",
  Houghton: "badge-houghton",
  Jensen: "badge-jensen",
  Lowe: "badge-lowe",
  Adams: "badge-adams",
};

export default function SearchView({ entries }: SearchViewProps) {
  const searchParams = useSearchParams();
  const initialFamily = searchParams.get("family") || "";
  const [query, setQuery] = useState("");
  const [familyFilter, setFamilyFilter] = useState(initialFamily);
  const [typeFilter, setTypeFilter] = useState<"all" | "person" | "story">("all");

  const fuse = useMemo(
    () =>
      new Fuse(entries, {
        keys: [
          { name: "title", weight: 2 },
          { name: "family", weight: 1.5 },
          { name: "tags", weight: 1 },
          { name: "birthPlace", weight: 1 },
          { name: "excerpt", weight: 0.5 },
        ],
        threshold: 0.35,
        includeScore: true,
      }),
    [entries]
  );

  const families = useMemo(() => {
    const fams = new Set<string>();
    for (const e of entries) if (e.family) fams.add(e.family);
    return [...fams].sort();
  }, [entries]);

  const results = useMemo(() => {
    let filtered = entries;
    if (query.trim()) {
      filtered = fuse.search(query).map((r) => r.item);
    }
    if (familyFilter) {
      filtered = filtered.filter(
        (e) => e.family.toLowerCase() === familyFilter.toLowerCase()
      );
    }
    if (typeFilter !== "all") {
      filtered = filtered.filter((e) => e.type === typeFilter);
    }
    return filtered;
  }, [query, familyFilter, typeFilter, entries, fuse]);

  useEffect(() => {
    if (initialFamily) setFamilyFilter(initialFamily);
  }, [initialFamily]);

  return (
    <div>
      {/* Search controls */}
      <div className="mb-8 space-y-4">
        <div>
          <label
            htmlFor="search-input"
            className="mb-2 block text-base font-semibold"
            style={{ color: "var(--text-medium-emphasis)" }}
          >
            Search
          </label>
          <input
            id="search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, places, stories..."
            className="w-full rounded-xl px-4 py-3 text-base"
            style={{
              minHeight: "48px",
              background: "var(--surface-secondary)",
              border: "1.5px solid var(--surface-border)",
              color: "var(--text-high-emphasis)",
            }}
            aria-describedby="search-results-count"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Family filter */}
          <div>
            <label
              htmlFor="family-filter"
              className="sr-only"
            >
              Filter by family
            </label>
            <select
              id="family-filter"
              value={familyFilter}
              onChange={(e) => setFamilyFilter(e.target.value)}
              className="rounded-lg px-4 py-2 text-base"
              style={{
                minHeight: "44px",
                background: "var(--surface-secondary)",
                border: "1.5px solid var(--surface-border)",
                color: "var(--text-high-emphasis)",
              }}
            >
              <option value="">All families</option>
              {families.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div className="flex gap-1" role="group" aria-label="Filter by type">
            {(["all", "person", "story"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className="rounded-lg px-4 py-2 text-base font-medium transition-colors"
                style={{
                  minHeight: "44px",
                  border: `1.5px solid ${typeFilter === t ? "var(--action-primary-dim)" : "var(--surface-border)"}`,
                  background: typeFilter === t ? "rgba(212, 165, 116, 0.12)" : "transparent",
                  color: typeFilter === t ? "var(--action-primary)" : "var(--text-medium-emphasis)",
                }}
                aria-pressed={typeFilter === t}
              >
                {t === "all" ? "All" : t === "person" ? "People" : "Stories"}
              </button>
            ))}
          </div>

          <p
            id="search-results-count"
            className="self-center text-base"
            style={{ color: "var(--text-medium-emphasis)" }}
            aria-live="polite"
          >
            {results.length} results
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="grid gap-4" role="list" aria-label="Search results">
        {results.map((entry) => (
          <Link
            key={`${entry.type}-${entry.slug}`}
            href={
              entry.type === "person"
                ? `/person/${entry.slug}/`
                : `/stories/${entry.slug}/`
            }
            className="card card-link group"
            role="listitem"
            aria-label={`${entry.type}: ${entry.title}${entry.family ? `, ${entry.family} family` : ""}`}
          >
            <div className="flex items-center gap-2">
              <span
                className="badge"
                style={{
                  background: "var(--surface-elevated)",
                  color: "var(--text-low-emphasis)",
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  letterSpacing: "0.05em",
                }}
              >
                {entry.type}
              </span>
              {entry.family && (
                <span className={`badge ${FAMILY_BADGE[entry.family] || ""}`}>
                  {entry.family}
                </span>
              )}
            </div>
            <h3 className="mt-2 text-lg font-semibold">
              {entry.title}
            </h3>
            <div
              className="mt-1 text-base"
              style={{ color: "var(--text-medium-emphasis)" }}
            >
              {entry.born && (
                <span>
                  {entry.born}
                  {entry.died ? ` \u2013 ${entry.died}` : ""}
                </span>
              )}
              {entry.birthPlace && (
                <span>
                  {entry.born ? " \u00b7 " : ""}
                  {entry.birthPlace}
                </span>
              )}
            </div>
            {entry.excerpt && (
              <p
                className="mt-1 text-sm line-clamp-2"
                style={{ color: "var(--text-low-emphasis)" }}
              >
                {entry.excerpt}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
