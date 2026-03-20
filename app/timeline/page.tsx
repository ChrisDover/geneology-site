import { parseTimeline } from "@/lib/timeline-builder";
import TimelineView from "@/components/TimelineView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Timeline",
  description: "Chronological events across 720 years of family history",
};

export default function TimelinePage() {
  const events = parseTimeline();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 font-[family-name:var(--font-serif)] text-3xl font-bold text-accent">
        Timeline
      </h1>
      <p className="mb-6 text-sm text-muted">
        {events.length} events spanning from the earliest known ancestors to
        the present day
      </p>
      <TimelineView events={events} />
    </div>
  );
}
