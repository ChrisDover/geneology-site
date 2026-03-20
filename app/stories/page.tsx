import Link from "next/link";
import { getAllStories } from "@/lib/parser";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stories",
  description: "Narrative histories bringing ancestors to life",
};

export default async function StoriesPage() {
  const stories = await getAllStories();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 font-[family-name:var(--font-serif)] text-3xl font-bold text-accent">
        Stories
      </h1>
      <p className="mb-8 text-muted">
        Narrative histories bringing ancestors to life
      </p>

      <div className="grid gap-4">
        {stories.map((story) => (
          <Link
            key={story.slug}
            href={`/stories/${story.slug}/`}
            className="group rounded-lg border border-card-border bg-card-bg p-6 transition-all hover:border-accent/40"
          >
            <h2 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-foreground group-hover:text-accent">
              {story.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {story.excerpt}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {story.tags
                .filter((t) => t !== "genealogy" && t !== "narrative")
                .map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-background px-2 py-0.5 text-xs text-muted"
                  >
                    {tag}
                  </span>
                ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
