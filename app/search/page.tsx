import { Suspense } from "react";
import { buildSearchIndex } from "@/lib/parser";
import SearchView from "@/components/SearchView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search across people, places, and stories",
};

export default async function SearchPage() {
  const entries = await buildSearchIndex();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 font-[family-name:var(--font-serif)] text-3xl font-bold text-accent">
        Search
      </h1>
      <p className="mb-6 text-sm text-muted">
        Search across {entries.length} people and stories
      </p>
      <Suspense>
        <SearchView entries={entries} />
      </Suspense>
    </div>
  );
}
