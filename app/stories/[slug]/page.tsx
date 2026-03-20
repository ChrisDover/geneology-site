import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllStories, getStoryBySlug } from "@/lib/parser";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const stories = await getAllStories();
  return stories.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) return { title: "Story Not Found" };
  return { title: story.title };
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <nav className="mb-6 text-sm text-muted">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>
        {" / "}
        <Link href="/stories/" className="hover:text-accent">
          Stories
        </Link>
        {" / "}
        <span className="text-foreground">{story.title}</span>
      </nav>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {story.tags
          .filter((t) => t !== "genealogy" && t !== "narrative")
          .map((tag) => (
            <span
              key={tag}
              className="rounded bg-card-bg px-2 py-0.5 text-xs text-muted"
            >
              {tag}
            </span>
          ))}
      </div>

      <article
        className="prose"
        dangerouslySetInnerHTML={{ __html: story.bodyHtml }}
      />

      <nav className="mt-12 border-t border-card-border pt-6">
        <Link
          href="/stories/"
          className="text-sm text-muted hover:text-accent"
        >
          &larr; All Stories
        </Link>
      </nav>
    </div>
  );
}
