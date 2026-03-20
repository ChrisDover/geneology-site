import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPersons, getPersonBySlug } from "@/lib/parser";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const persons = await getAllPersons();
  return persons.map((p) => ({
    slug: p.slug.split("/"),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const person = await getPersonBySlug(slug.join("/"));
  if (!person) return { title: "Person Not Found" };
  return {
    title: person.name,
    description: `${person.name} (${person.born || "?"} - ${person.died || "?"}) — ${person.family} family`,
  };
}

const FAMILY_BADGE: Record<string, string> = {
  Dover: "badge-dover",
  Houghton: "badge-houghton",
  Jensen: "badge-jensen",
  Lowe: "badge-lowe",
  Adams: "badge-adams",
};

const FAMILY_COLORS: Record<string, string> = {
  Dover: "var(--family-dover)",
  Houghton: "var(--family-houghton)",
  Jensen: "var(--family-jensen)",
  Adams: "var(--family-adams)",
  Lowe: "var(--family-lowe)",
};

export default async function PersonPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const person = await getPersonBySlug(slug.join("/"));
  if (!person) notFound();

  const allPersons = await getAllPersons();
  const familyMembers = allPersons.filter((p) => p.family === person.family);
  const currentIdx = familyMembers.findIndex((p) => p.slug === person.slug);
  const prev = currentIdx > 0 ? familyMembers[currentIdx - 1] : null;
  const next =
    currentIdx < familyMembers.length - 1
      ? familyMembers[currentIdx + 1]
      : null;

  const color = FAMILY_COLORS[person.family] || "var(--action-primary)";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav
        className="mb-6 text-base"
        aria-label="Breadcrumb"
        style={{ color: "var(--text-medium-emphasis)" }}
      >
        <ol className="flex flex-wrap gap-1" role="list">
          <li>
            <Link href="/" className="hover:underline" style={{ color: "var(--text-medium-emphasis)", minHeight: "auto" }}>
              Home
            </Link>
            <span aria-hidden="true"> / </span>
          </li>
          <li>
            <Link href="/search/" className="hover:underline" style={{ color: "var(--text-medium-emphasis)", minHeight: "auto" }}>
              People
            </Link>
            <span aria-hidden="true"> / </span>
          </li>
          <li>
            <Link
              href={`/search/?family=${person.family}`}
              className="hover:underline"
              style={{ color: "var(--text-medium-emphasis)", minHeight: "auto" }}
            >
              {person.family}
            </Link>
            <span aria-hidden="true"> / </span>
          </li>
          <li aria-current="page" style={{ color: "var(--text-high-emphasis)" }}>
            {person.name}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1
            className="text-3xl font-bold"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--action-primary)",
            }}
          >
            {person.name}
          </h1>
          <span className={`badge ${FAMILY_BADGE[person.family] || ""}`}>
            <span
              className="family-dot"
              style={{ background: color, width: 8, height: 8 }}
              aria-hidden="true"
            />
            {person.family}
          </span>
        </div>

        {person.relationshipToChris && (
          <p
            className="mt-2 text-base italic"
            style={{ color: "var(--text-medium-emphasis)" }}
          >
            {person.relationshipToChris}
          </p>
        )}

        <dl
          className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-base"
          style={{ color: "var(--text-medium-emphasis)" }}
        >
          {person.born && (
            <div>
              <dt className="sr-only">Born</dt>
              <dd>
                Born:{" "}
                <strong style={{ color: "var(--text-high-emphasis)" }}>
                  {person.born}
                </strong>
                {person.birthPlace && `, ${person.birthPlace}`}
              </dd>
            </div>
          )}
          {person.died && (
            <div>
              <dt className="sr-only">Died</dt>
              <dd>
                Died:{" "}
                <strong style={{ color: "var(--text-high-emphasis)" }}>
                  {person.died}
                </strong>
                {person.deathPlace && `, ${person.deathPlace}`}
              </dd>
            </div>
          )}
        </dl>

        {/* Confidence & Sources */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className="badge"
            style={{
              background: "var(--surface-elevated)",
              color: "var(--text-medium-emphasis)",
            }}
          >
            {person.confidence}
          </span>
          {person.sources.map((s) => (
            <span
              key={s}
              className="badge"
              style={{
                background: "var(--surface-elevated)",
                color: "var(--text-medium-emphasis)",
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* Main content */}
        <article
          className="prose"
          aria-label={`Details about ${person.name}`}
          dangerouslySetInnerHTML={{ __html: person.bodyHtml }}
        />

        {/* Sidebar */}
        <aside className="space-y-6" aria-label="Family connections and tags">
          {/* Family links */}
          {(person.parents.length > 0 ||
            person.spouses.length > 0 ||
            person.children.length > 0) && (
            <div className="card">
              <h3
                className="mb-3 text-lg font-semibold"
                style={{ color: "var(--action-primary)" }}
              >
                Family
              </h3>

              {person.parents.length > 0 && (
                <div className="mb-3">
                  <p
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: "var(--text-low-emphasis)" }}
                  >
                    Parents
                  </p>
                  {person.parents.map((p, i) => (
                    <div key={i} className="mt-1">
                      {p.slug ? (
                        <Link
                          href={`/person/${p.slug}/`}
                          className="text-base underline"
                          style={{
                            color: "var(--action-primary)",
                            textUnderlineOffset: "3px",
                            minHeight: "auto",
                          }}
                        >
                          {p.name}
                        </Link>
                      ) : (
                        <span className="text-base">{p.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {person.spouses.length > 0 && (
                <div className="mb-3">
                  <p
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: "var(--text-low-emphasis)" }}
                  >
                    Spouses
                  </p>
                  {person.spouses.map((s, i) => (
                    <div key={i} className="mt-1">
                      {s.slug ? (
                        <Link
                          href={`/person/${s.slug}/`}
                          className="text-base underline"
                          style={{
                            color: "var(--action-primary)",
                            textUnderlineOffset: "3px",
                            minHeight: "auto",
                          }}
                        >
                          {s.name}
                        </Link>
                      ) : (
                        <span className="text-base">{s.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {person.children.length > 0 && (
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: "var(--text-low-emphasis)" }}
                  >
                    Children
                  </p>
                  {person.children.map((c, i) => (
                    <div key={i} className="mt-1">
                      {c.slug ? (
                        <Link
                          href={`/person/${c.slug}/`}
                          className="text-base underline"
                          style={{
                            color: "var(--action-primary)",
                            textUnderlineOffset: "3px",
                            minHeight: "auto",
                          }}
                        >
                          {c.name}
                        </Link>
                      ) : (
                        <span className="text-base">{c.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {person.tags.length > 0 && (
            <div className="card">
              <h3
                className="mb-3 text-lg font-semibold"
                style={{ color: "var(--action-primary)" }}
              >
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {person.tags.map((tag) => (
                  <span
                    key={tag}
                    className="badge"
                    style={{
                      background: "var(--surface-primary)",
                      color: "var(--text-medium-emphasis)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Prev/Next navigation */}
      <nav
        className="mt-12 flex justify-between pt-6"
        style={{ borderTop: "1px solid var(--surface-border)" }}
        aria-label="Person navigation"
      >
        {prev ? (
          <Link
            href={`/person/${prev.slug}/`}
            className="text-base"
            style={{ color: "var(--text-medium-emphasis)", minHeight: "44px", display: "inline-flex", alignItems: "center" }}
          >
            &larr; {prev.name}
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/person/${next.slug}/`}
            className="text-base"
            style={{ color: "var(--text-medium-emphasis)", minHeight: "44px", display: "inline-flex", alignItems: "center" }}
          >
            {next.name} &rarr;
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </div>
  );
}
