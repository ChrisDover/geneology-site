import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import type {
  Person,
  Story,
  RelationLink,
  LocationEvent,
  SearchEntry,
} from "./types";
import { geocode } from "./geocoder";
import { buildFamilyTree, flattenTree } from "./tree-builder";
import type { TreeNode } from "./types";

const VAULT_PATH =
  process.env.VAULT_PATH || path.join(process.cwd(), "..", "geneology");

// Cache parsed data across calls during a single build
let cachedPersons: Person[] | null = null;
let cachedStories: Story[] | null = null;
let fileSlugMap: Map<string, string> | null = null;

function getVaultPath(...parts: string[]): string {
  return path.join(VAULT_PATH, ...parts);
}

function getAllMarkdownFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== ".git" && entry.name !== "templates") {
      results.push(...getAllMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md") && !entry.name.startsWith("_")) {
      results.push(fullPath);
    }
  }
  return results;
}

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function filePathToSlug(filePath: string): string {
  const rel = path.relative(VAULT_PATH, filePath);
  // For person files: Surnames/Dover/William_Henry_Dover.md -> dover/william-henry-dover
  const match = rel.match(/Surnames\/(\w+)\/(.+)\.md$/);
  if (match) {
    return `${match[1].toLowerCase()}/${nameToSlug(match[2])}`;
  }
  // For story files: Stories/Dover_Oxfordshire_to_Doverville.md -> dover-oxfordshire-to-doverville
  const storyMatch = rel.match(/Stories\/(.+)\.md$/);
  if (storyMatch) {
    return nameToSlug(storyMatch[1]);
  }
  return nameToSlug(path.basename(filePath, ".md"));
}

function buildFileSlugMap(): Map<string, string> {
  if (fileSlugMap) return fileSlugMap;
  fileSlugMap = new Map();
  const allFiles = getAllMarkdownFiles(VAULT_PATH);
  for (const f of allFiles) {
    const rel = path.relative(VAULT_PATH, f).replace(/\.md$/, "");
    const slug = filePathToSlug(f);
    // Map various lookup forms to the slug
    fileSlugMap.set(rel, slug);
    // Without Surnames/ prefix
    const noSurnames = rel.replace(/^Surnames\//, "");
    fileSlugMap.set(noSurnames, slug);
    // Just the basename
    fileSlugMap.set(path.basename(rel), slug);
  }
  return fileSlugMap;
}

function resolveWikilink(link: string): { display: string; href: string } {
  const map = buildFileSlugMap();
  // [[path|display]] or [[path]]
  const parts = link.split("|");
  const linkPath = parts[0].trim();
  const display = (parts[1] || parts[0]).trim();

  const slug = map.get(linkPath) || map.get(linkPath.replace(/^Surnames\//, ""));

  if (slug) {
    // Determine if it's a person or story
    if (linkPath.includes("Stories/")) {
      return { display, href: `/stories/${slug}/` };
    }
    if (
      linkPath.includes("Dover/") ||
      linkPath.includes("Houghton/") ||
      linkPath.includes("Jensen/") ||
      linkPath.includes("Lowe/") ||
      linkPath.includes("Adams/") ||
      linkPath.includes("Surnames/")
    ) {
      return { display, href: `/person/${slug}/` };
    }
    // Reference files
    if (linkPath === "Family_Tree" || linkPath === "Timeline") {
      const page = linkPath === "Family_Tree" ? "tree" : "timeline";
      return { display, href: `/${page}/` };
    }
  }

  return { display, href: "#" };
}

function replaceWikilinks(html: string): string {
  return html.replace(/\[\[([^\]]+)\]\]/g, (_, content) => {
    const { display, href } = resolveWikilink(content);
    if (href === "#") return display;
    return `<a href="${href}" class="wiki-link">${display}</a>`;
  });
}

async function markdownToHtml(md: string): Promise<string> {
  const result = await remark().use(remarkGfm).use(remarkHtml, { sanitize: false }).process(md);
  return replaceWikilinks(String(result));
}

function dateToString(val: unknown): string | null {
  if (!val || val === "YYYY") return null;
  if (val instanceof Date) {
    // gray-matter parses YAML dates like 1836-11-15 into Date objects
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(val);
  if (s === "YYYY") return null;
  return s;
}

function normalizeFamily(family: string, surname: string): string {
  // "Dover (married); Jensen (birth)" -> use the directory surname
  // "Adam" -> "Adams" (normalize common variants)
  if (family.includes(";") || family.includes("(")) {
    // Use the directory the file is in as the canonical family
    return surname;
  }
  // Normalize Adam -> Adams
  if (family === "Adam") return "Adams";
  if (family === "Nurse" || family === "Light") return "Houghton";
  return family;
}

function parseYear(dateStr: string | null | undefined): number | null {
  if (!dateStr || dateStr === "YYYY") return null;
  const str = String(dateStr).replace("~", "");
  // Try YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})/);
  if (isoMatch) return parseInt(isoMatch[1], 10);
  return null;
}

function extractVitalField(body: string, field: string): string | null {
  // Match rows in the vital information table: | Field | Value | ...
  const regex = new RegExp(
    `\\|\\s*${field}\\s*\\|\\s*([^|]+)\\|`,
    "i"
  );
  const match = body.match(regex);
  if (match) return match[1].trim();
  return null;
}

function extractRelationships(body: string): {
  parents: RelationLink[];
  spouses: RelationLink[];
  children: RelationLink[];
} {
  const parents: RelationLink[] = [];
  const spouses: RelationLink[] = [];
  const children: RelationLink[] = [];

  // Find the Family section
  const familyMatch = body.match(/## Family\n([\s\S]*?)(?=\n## |\n$)/);
  if (!familyMatch) return { parents, spouses, children };
  const section = familyMatch[1];

  // Parse wikilinks and text patterns in the family section
  const lines = section.split("\n");
  for (const line of lines) {
    const wikilinks = [...line.matchAll(/\[\[([^\]]+)\]\]/g)];

    if (/\*\*Father\*\*/i.test(line) || /\*\*Mother\*\*/i.test(line)) {
      for (const wl of wikilinks) {
        const { display, href } = resolveWikilink(wl[1]);
        parents.push({
          name: display,
          slug: href !== "#" ? href.replace(/^\/person\//, "").replace(/\/$/, "") : null,
          detail: line.replace(/^[\s-]*/, "").replace(/\*\*/g, ""),
        });
      }
      if (wikilinks.length === 0) {
        // Extract name from text
        const nameMatch = line.match(/\*\*(?:Father|Mother)\*\*:?\s*(.+)/i);
        if (nameMatch) {
          parents.push({
            name: nameMatch[1].split("(")[0].trim(),
            slug: null,
            detail: line.replace(/^[\s-]*/, "").replace(/\*\*/g, ""),
          });
        }
      }
    } else if (/\*\*.*Spouse\*\*/i.test(line)) {
      const nameMatch = line.match(/\*\*.*Spouse.*\*\*:?\s*(?:\[\[([^\]]+)\]\]|([^(,]+))/i);
      if (nameMatch) {
        const raw = nameMatch[1] || nameMatch[2];
        if (nameMatch[1]) {
          const { display, href } = resolveWikilink(nameMatch[1]);
          spouses.push({
            name: display,
            slug: href !== "#" ? href.replace(/^\/person\//, "").replace(/\/$/, "") : null,
            detail: line.replace(/^[\s-]*/, "").replace(/\*\*/g, ""),
          });
        } else {
          spouses.push({
            name: raw.trim(),
            slug: null,
            detail: line.replace(/^[\s-]*/, "").replace(/\*\*/g, ""),
          });
        }
      }
    } else if (/Children:/i.test(line)) {
      // Extract children names from comma-separated list
      const childPart = line.replace(/.*Children:\s*/i, "");
      const names = childPart.split(",").map((n) => n.trim().split("(")[0].trim());
      for (const n of names) {
        if (n) children.push({ name: n, slug: null, detail: "" });
      }
    }
  }

  return { parents, spouses, children };
}

function extractLocations(
  body: string,
  frontmatter: Record<string, unknown>,
  slug: string,
  name: string,
  family: string
): LocationEvent[] {
  const locations: LocationEvent[] = [];
  const seen = new Set<string>();

  function addLocation(place: string, date: string | null, eventType: string) {
    const coords = geocode(place);
    if (!coords) return;
    const key = `${place}-${eventType}`;
    if (seen.has(key)) return;
    seen.add(key);
    locations.push({
      place,
      date,
      lat: coords[0],
      lng: coords[1],
      eventType,
      personSlug: slug,
      personName: name,
      familyLine: family,
    });
  }

  // Birth/death from vital info table
  const birthPlace = extractVitalField(body, "Birth Place");
  if (birthPlace) addLocation(birthPlace, dateToString(frontmatter.born), "birth");

  const deathPlace = extractVitalField(body, "Death Place");
  if (deathPlace) addLocation(deathPlace, dateToString(frontmatter.died), "death");

  // Residence entries
  const residenceRegex = /\|\s*Residence\s*\(([^)]+)\)\s*\|\s*([^|]+)\|/gi;
  let rm;
  while ((rm = residenceRegex.exec(body)) !== null) {
    addLocation(rm[2].trim(), rm[1].trim(), "residence");
  }

  // Migration timeline items (numbered list with **date**: Place pattern)
  const migrationRegex = /\d+\.\s+\*\*([^*]+)\*\*:?\s*(.+)/g;
  let mm;
  while ((mm = migrationRegex.exec(body)) !== null) {
    const text = mm[2];
    // Try to find place names in the text by checking against geocoder
    const coords = geocode(text);
    if (coords) {
      addLocation(text.split(".")[0].split(",").slice(0, 3).join(",").trim(), mm[1], "migration");
    }
  }

  return locations;
}

export async function getAllPersons(): Promise<Person[]> {
  if (cachedPersons) return cachedPersons;

  const surnameDirs = ["Dover", "Houghton", "Jensen", "Lowe"];
  const persons: Person[] = [];

  for (const surname of surnameDirs) {
    const dir = getVaultPath("Surnames", surname);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const raw = fs.readFileSync(fullPath, "utf-8");
      const { data, content } = matter(raw);

      if (data.type !== "person") continue;

      const slug = filePathToSlug(fullPath);
      const name = data.name || path.basename(file, ".md").replace(/_/g, " ");
      const family = normalizeFamily(data.family || surname, surname);
      const bornStr = dateToString(data.born);
      const diedStr = dateToString(data.died);
      const bodyHtml = await markdownToHtml(content);
      const { parents, spouses, children } = extractRelationships(content);
      const locations = extractLocations(content, data, slug, name, family);

      // Extract relationship description (first bold line after heading)
      const relMatch = content.match(/\*\*([^*]+)\*\*/);
      const relationshipToChris = relMatch ? relMatch[1] : null;

      persons.push({
        slug,
        filePath: path.relative(VAULT_PATH, fullPath),
        name,
        born: bornStr,
        bornYear: parseYear(bornStr),
        died: diedStr,
        diedYear: parseYear(diedStr),
        family,
        confidence: data.confidence || "Unknown",
        sources: Array.isArray(data.sources) ? data.sources : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
        birthPlace: extractVitalField(content, "Birth Place"),
        deathPlace: extractVitalField(content, "Death Place"),
        burialPlace: extractVitalField(content, "Burial"),
        occupation: extractVitalField(content, "Occupation.*"),
        locations,
        parents,
        spouses,
        children,
        bodyHtml,
        relationshipToChris,
      });
    }
  }

  // Generate fallback persons from tree nodes that don't have markdown files
  const existingSlugs = new Set(persons.map((p) => p.slug));
  const tree = buildFamilyTree();
  const allNodes = flattenTree(tree);

  for (const node of allNodes) {
    if (!node.slug || existingSlugs.has(node.slug)) continue;

    const bornStr = node.attributes?.born || null;
    const diedStr = node.attributes?.died || null;
    const noteStr = node.attributes?.note || null;

    persons.push({
      slug: node.slug,
      filePath: "",
      name: node.name,
      born: bornStr,
      bornYear: parseYear(bornStr),
      died: diedStr,
      diedYear: parseYear(diedStr),
      family: node.familyLine || "Other",
      confidence: "From Family Tree",
      sources: [],
      tags: [],
      birthPlace: null,
      deathPlace: null,
      burialPlace: null,
      occupation: null,
      locations: [],
      parents: [],
      spouses: [],
      children: [],
      bodyHtml: noteStr
        ? `<p><em>${noteStr}</em></p>`
        : "",
      relationshipToChris: null,
    });
  }

  // Sort by birth year
  persons.sort((a, b) => (a.bornYear || 9999) - (b.bornYear || 9999));
  cachedPersons = persons;
  return persons;
}

export async function getPersonBySlug(slug: string): Promise<Person | undefined> {
  const all = await getAllPersons();
  return all.find((p) => p.slug === slug);
}

export async function getAllStories(): Promise<Story[]> {
  if (cachedStories) return cachedStories;

  const dir = getVaultPath("Stories");
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  const stories: Story[] = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const { data, content } = matter(raw);

    const slug = nameToSlug(path.basename(file, ".md"));
    const titleMatch = content.match(/^#\s+(.+)/m);
    const title = titleMatch ? titleMatch[1] : path.basename(file, ".md").replace(/_/g, " ");

    // Get first paragraph as excerpt (skip headings and blank lines)
    const paragraphs = content
      .split(/\n\n/)
      .filter((p) => p.trim() && !p.trim().startsWith("#"));
    const excerpt = paragraphs[0]
      ? paragraphs[0].replace(/[*_\[\]#]/g, "").replace(/\n/g, " ").trim().slice(0, 200) + "..."
      : "";

    const bodyHtml = await markdownToHtml(content);

    stories.push({
      slug,
      title,
      tags: Array.isArray(data.tags) ? data.tags : [],
      person: data.person || null,
      bodyHtml,
      excerpt,
    });
  }

  cachedStories = stories;
  return stories;
}

export async function getStoryBySlug(slug: string): Promise<Story | undefined> {
  const all = await getAllStories();
  return all.find((s) => s.slug === slug);
}

export async function getAllLocations(): Promise<LocationEvent[]> {
  const persons = await getAllPersons();
  return persons.flatMap((p) => p.locations);
}

export async function buildSearchIndex(): Promise<SearchEntry[]> {
  const persons = await getAllPersons();
  const stories = await getAllStories();

  const entries: SearchEntry[] = [];

  for (const p of persons) {
    entries.push({
      type: "person",
      slug: p.slug,
      title: p.name,
      family: p.family,
      tags: p.tags,
      born: p.born,
      died: p.died,
      birthPlace: p.birthPlace,
      excerpt: p.relationshipToChris || `${p.family} family`,
    });
  }

  for (const s of stories) {
    entries.push({
      type: "story",
      slug: s.slug,
      title: s.title,
      family: s.tags.find((t) => ["dover", "houghton", "jensen", "lowe", "adams"].includes(t)) || "",
      tags: s.tags,
      born: null,
      died: null,
      birthPlace: null,
      excerpt: s.excerpt,
    });
  }

  return entries;
}
