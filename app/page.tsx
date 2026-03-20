import Link from "next/link";
import { getAllPersons, getAllStories } from "@/lib/parser";
import { parseTimeline } from "@/lib/timeline-builder";

export default async function HomePage() {
  const persons = await getAllPersons();
  const stories = await getAllStories();
  const timeline = parseTimeline();

  const families = [...new Set(persons.map((p) => p.family))];
  // Countries represented across people and stories
  const countries = new Set(["England", "Scotland", "Denmark", "USA", "Wales", "Ireland"]);

  // Person files go back to 1668, but verified research traces to:
  // - Godfrey Pollicott d. 1408 (confirmed via Warwick University research)
  // - "Policote" in Domesday Book 1086 (place name origin)
  // "Policote" recorded in the Domesday Book, 1086
  // Ralph Polecot (~1234) is the earliest named person with the surname
  // Godfrey Pollicott (d. 1408) is the earliest confirmed direct ancestor
  const EARLIEST_RECORD_YEAR = 1086; // Domesday Book
  const latestYear = Math.max(
    ...persons.filter((p) => p.diedYear).map((p) => p.diedYear!)
  );
  const yearsOfHistory = latestYear - EARLIEST_RECORD_YEAR;

  const features = [
    {
      href: "/tree/",
      title: "Family Tree",
      desc: "Interactive tree spanning 20+ generations back to the Domesday Book era",
      icon: "\u{1F333}",
    },
    {
      href: "/timeline/",
      title: "Timeline",
      desc: `${timeline.length} dated events from the 1700s to ${latestYear}`,
      icon: "\u{1F4C5}",
    },
    {
      href: "/map/",
      title: "Migration Map",
      desc: "Follow the family journeys across continents",
      icon: "\u{1F5FA}",
    },
    {
      href: "/stories/",
      title: "Stories",
      desc: `${stories.length} narrative histories bringing ancestors to life`,
      icon: "\u{1F4D6}",
    },
  ];

  const familyColors: Record<string, string> = {
    Dover: "var(--family-dover)",
    Houghton: "var(--family-houghton)",
    Jensen: "var(--family-jensen)",
    Adams: "var(--family-adams)",
    Lowe: "var(--family-lowe)",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Hero */}
      <section className="mb-16 text-center" aria-labelledby="hero-heading">
        <h1
          id="hero-heading"
          className="text-4xl font-bold sm:text-5xl"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--action-primary)",
          }}
        >
          Dover-Houghton
        </h1>
        <p
          className="mt-2 text-xl"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--text-medium-emphasis)",
          }}
        >
          Family History
        </p>
        <p
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed"
          style={{ color: "var(--text-high-emphasis)" }}
        >
          An interactive genealogy spanning{" "}
          <strong style={{ color: "var(--action-primary)" }}>
            {yearsOfHistory}+ years
          </strong>
          , {countries.size} countries, and{" "}
          <strong style={{ color: "var(--action-primary)" }}>
            35+ surnames
          </strong>
          &mdash;from the Domesday Book (1086) to the present day.
        </p>
      </section>

      {/* Stats — above the fold priority */}
      <section
        className="mb-16 grid grid-cols-2 gap-4 sm:grid-cols-4"
        aria-label="Key statistics"
      >
        {[
          { value: persons.length, label: "People" },
          { value: "35+", label: "Surnames" },
          { value: timeline.length, label: "Events" },
          { value: stories.length, label: "Stories" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="card text-center"
            role="figure"
            aria-label={`${stat.value} ${stat.label}`}
          >
            <div
              className="text-3xl font-bold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--action-primary)",
              }}
              aria-hidden="true"
            >
              {stat.value}
            </div>
            <div
              className="mt-1 text-sm"
              style={{ color: "var(--text-medium-emphasis)" }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </section>

      {/* Feature Cards — 2-column responsive grid */}
      <section className="mb-16" aria-labelledby="explore-heading">
        <h2 id="explore-heading" className="sr-only">
          Explore the family history
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="card card-link group"
              aria-label={`${f.title}: ${f.desc}`}
            >
              <span className="text-2xl" aria-hidden="true">
                {f.icon}
              </span>
              <h3
                className="mt-2 text-xl font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {f.title}
              </h3>
              <p
                className="mt-1 text-sm"
                style={{ color: "var(--text-medium-emphasis)" }}
              >
                {f.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Family Lines — color + text label, never color alone */}
      <section aria-labelledby="families-heading">
        <h2
          id="families-heading"
          className="mb-6 text-2xl font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Family Lines
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {families.map((family) => {
            const members = persons.filter((p) => p.family === family);
            const earliest = members.reduce(
              (min, p) =>
                p.bornYear && p.bornYear < min ? p.bornYear : min,
              9999
            );
            const color = familyColors[family] || "var(--action-primary)";

            return (
              <Link
                key={family}
                href={`/search/?family=${family}`}
                className="card card-link"
                style={{ borderLeft: `4px solid ${color}` }}
                aria-label={`${family} family: ${members.length} people, from ${earliest < 9999 ? earliest : "unknown"}`}
              >
                <div className="family-indicator">
                  <span
                    className="family-dot"
                    style={{ background: color }}
                    aria-hidden="true"
                  />
                  <h3 className="font-semibold">{family}</h3>
                </div>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--text-medium-emphasis)" }}
                >
                  {members.length} people &middot; from{" "}
                  {earliest < 9999 ? earliest : "unknown"}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
