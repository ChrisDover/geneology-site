import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { TimelineEvent } from "./types";

const VAULT_PATH =
  process.env.VAULT_PATH || path.join(process.cwd(), "..", "geneology");

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseSortKey(dateStr: string): number {
  const cleaned = dateStr.replace("~", "").trim();

  // Full date: 15 November 1836, or 14 May 1814, or 3 Jul 1927
  const fullDate = cleaned.match(
    /(\d{1,2})\s+(\w+)\s+(\d{4})/
  );
  if (fullDate) {
    const d = new Date(`${fullDate[2]} ${fullDate[1]}, ${fullDate[3]}`);
    if (!isNaN(d.getTime())) return d.getTime();
  }

  // Month Year: Feb 1755
  const monthYear = cleaned.match(/(\w+)\s+(\d{4})/);
  if (monthYear) {
    const d = new Date(`${monthYear[1]} 1, ${monthYear[2]}`);
    if (!isNaN(d.getTime())) return d.getTime();
  }

  // Just year
  const year = cleaned.match(/(\d{4})/);
  if (year) return new Date(`Jan 1, ${year[1]}`).getTime();

  return 0;
}

function guessFamilyLine(persons: string): string {
  const lower = persons.toLowerCase();
  if (lower.includes("dover") || lower.includes("newcombe") || lower.includes("sheppard") || lower.includes("bryant"))
    return "Dover";
  if (lower.includes("houghton") || lower.includes("nurse") || lower.includes("light") || lower.includes("moody"))
    return "Houghton";
  if (lower.includes("jensen") || lower.includes("geisler") || lower.includes("amidan") || lower.includes("pedersen"))
    return "Jensen";
  if (lower.includes("lowe") || lower.includes("spaulding"))
    return "Lowe";
  if (lower.includes("adams") || lower.includes("billingsley") || lower.includes("shirts") || lower.includes("barclay"))
    return "Adams";
  return "Other";
}

export function parseTimeline(): TimelineEvent[] {
  const filePath = path.join(VAULT_PATH, "Timeline.md");
  if (!fs.existsSync(filePath)) return [];

  const raw = fs.readFileSync(filePath, "utf-8");
  const { content } = matter(raw);

  const events: TimelineEvent[] = [];
  let currentEra = "";

  const lines = content.split("\n");
  for (const line of lines) {
    // Detect era headers
    const eraMatch = line.match(/^## (.+)/);
    if (eraMatch) {
      currentEra = eraMatch[1].trim();
      continue;
    }

    // Parse table rows (skip header and separator rows)
    if (!line.startsWith("|") || line.includes("---") || line.includes("Date")) continue;

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c);
    if (cells.length < 4) continue;

    const [date, event, persons, location, source] = cells;

    events.push({
      date,
      sortKey: parseSortKey(date),
      event,
      persons,
      personSlugs: [], // Could be resolved later if needed
      location: location || "",
      source: source || "",
      era: currentEra,
    });
  }

  // Sort chronologically
  events.sort((a, b) => a.sortKey - b.sortKey);

  // Add family line info
  for (const e of events) {
    (e as TimelineEvent & { familyLine?: string }).familyLine = guessFamilyLine(e.persons);
  }

  return events;
}
