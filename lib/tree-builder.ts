import fs from "fs";
import path from "path";
import type { TreeNode } from "./types";

const VAULT_PATH =
  process.env.VAULT_PATH || path.join(process.cwd(), "..", "geneology");

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Build a lookup of all actual person file slugs on disk
function buildSlugIndex(): Set<string> {
  const slugs = new Set<string>();
  const dirs = ["Dover", "Houghton", "Jensen", "Lowe"];
  for (const dir of dirs) {
    const dirPath = path.join(VAULT_PATH, "Surnames", dir);
    if (!fs.existsSync(dirPath)) continue;
    for (const file of fs.readdirSync(dirPath)) {
      if (!file.endsWith(".md")) continue;
      const slug = `${dir.toLowerCase()}/${nameToSlug(file.replace(/\.md$/, ""))}`;
      slugs.add(slug);
    }
  }
  return slugs;
}

function determineFamilyLine(name: string, parentLine: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("dover")) return "Dover";
  if (lower.includes("houghton")) return "Houghton";
  if (lower.includes("jensen") || lower.includes("pedersen") || lower.includes("larsdatter") || lower.includes("hansen")) return "Jensen";
  if (lower.includes("lowe") || lower.includes("spaulding")) return "Lowe";
  if (lower.includes("adam")) return "Adams";
  if (lower.includes("nurse") || lower.includes("gardener") || lower.includes("germaine")) return "Houghton";
  if (lower.includes("bryant") || lower.includes("newcombe") || lower.includes("sheppard") || lower.includes("wiggins") || lower.includes("fitch") || lower.includes("turner") || lower.includes("policot")) return "Dover";
  if (lower.includes("geisler") || lower.includes("amidan")) return "Jensen";
  if (lower.includes("billingsley") || lower.includes("shirts")) return "Adams";
  if (lower.includes("moody") || lower.includes("light") || lower.includes("pink")) return "Houghton";
  if (lower.includes("scot") || lower.includes("dickie") || lower.includes("barclay") || lower.includes("aitken")) return "Adams";
  return parentLine || "Other";
}

function findSlug(
  name: string,
  familyLine: string,
  slugIndex: Set<string>,
  birthYear: string | null,
): string | undefined {
  const baseName = name.replace(/\s*\(.*\)/, "").replace(/\s+/g, " ").trim();
  const slug = nameToSlug(baseName);

  // Special name mappings for people whose file names differ from tree names
  const ALIASES: Record<string, string> = {
    "betty-mae-jensen": "dover/betty-dover",
    "bernard-frank-william-houghton": "houghton/bernard-houghton",
    "sharon-renae-houghton": "dover/sharon-renae-dover",
    "jennie-zella-lowe": "houghton/jenny-houghton",
  };
  if (ALIASES[slug]) {
    return slugIndex.has(ALIASES[slug]) ? ALIASES[slug] : undefined;
  }

  // Try exact match with various directory prefixes
  const dirs = [familyLine.toLowerCase(), "dover", "houghton", "jensen", "lowe"];
  for (const dir of dirs) {
    if (slugIndex.has(`${dir}/${slug}`)) return `${dir}/${slug}`;
  }

  // For ambiguous names like "Thomas Dover", try with birth year suffix
  if (birthYear) {
    const yearMatch = birthYear.match(/(\d{4})/);
    if (yearMatch) {
      const slugWithYear = `${slug}-${yearMatch[1]}`;
      for (const dir of dirs) {
        if (slugIndex.has(`${dir}/${slugWithYear}`)) return `${dir}/${slugWithYear}`;
      }
    }
  }

  // Try matching by prefix (e.g. "john-dover" might match "john-dover-1697")
  // Only if there's exactly one match to avoid ambiguity
  if (slug.split("-").length >= 2) {
    const matches: string[] = [];
    for (const existing of slugIndex) {
      const filePart = existing.split("/")[1];
      if (filePart?.startsWith(slug + "-") || filePart === slug) {
        matches.push(existing);
      }
    }
    if (matches.length === 1) return matches[0];
  }

  return undefined;
}

interface LineInfo {
  depth: number;
  names: string[];       // Can have multiple people on one line (e.g., "X + Y")
  rawText: string;
  born: string | null;
  died: string | null;
  note: string | null;
}

function parseLine(line: string): LineInfo | null {
  // Find the position of ├ or └ (the branch marker)
  const branchMatch = line.match(/^([\s│]*)[├└]/);
  if (!branchMatch && !line.match(/^\w/)) {
    // Check for + continuation lines (spouse lines like "+ Katherine Turner")
    const plusMatch = line.match(/^([\s│]*)\+\s+(.+)/);
    if (plusMatch) {
      const prefix = plusMatch[1];
      const depth = Math.round(prefix.replace(/│/g, "X").length / 4);
      const rawText = plusMatch[2].trim();
      const names = extractNames(rawText);
      const { born, died, note } = extractDates(rawText);
      return names.length > 0 ? { depth, names, rawText, born, died, note } : null;
    }
    return null;
  }

  // Root line (Chris Dover at position 0)
  if (line.match(/^\w/)) {
    const names = extractNames(line);
    const { born, died, note } = extractDates(line);
    return names.length > 0 ? { depth: 0, names, rawText: line, born, died, note } : null;
  }

  // Measure depth by the position of the branch character
  const prefix = branchMatch![1];
  // Each level of indentation is 4 characters (│ + 3 spaces, or 4 spaces)
  const depth = Math.round(prefix.replace(/│/g, "X").length / 4) + 1;

  // Extract the text after ├── or └──
  const textMatch = line.match(/[├└]\s*─+\s*(.+)/);
  if (!textMatch) return null;

  const rawText = textMatch[1].trim();

  // Skip non-person entries
  if (rawText.startsWith("Founded") || rawText.startsWith("[mother")) return null;

  const names = extractNames(rawText);
  const { born, died, note } = extractDates(rawText);

  return names.length > 0 ? { depth, names, rawText, born, died, note } : null;
}

function extractNames(text: string): string[] {
  // Handle "Person A + Person B" patterns
  // First, remove parenthetical content for name extraction
  const cleaned = text.replace(/\([^)]*\)/g, "").trim();

  // Split on " + " to find multiple people
  const parts = cleaned.split(/\s+\+\s+/);

  const names: string[] = [];
  for (const part of parts) {
    // Remove annotations: ★, ⚠️, ←, →, —, etc.
    let name = part
      .replace(/[★⚠️←→▸▹●]/g, "")
      .replace(/\s*—\s*.*/g, "")
      .replace(/\s*IMMIGRANT\s*/g, "")
      .replace(/\s*EARLIEST\s+\w+\s*/g, "")
      .replace(/\s*CONFIRMED\s*/g, "")
      .replace(/\s*TOOK\s+.*/g, "")
      .replace(/\s*BIOLOGICAL\s+.*/g, "")
      .replace(/\s*SURNAME\s+.*/g, "")
      .replace(/\s*TRUE\s+.*/g, "")
      .trim();

    // Must start with a capital letter and have at least 2 chars
    if (name.length >= 2 && /^[A-Z]/.test(name)) {
      names.push(name);
    }
  }

  return names;
}

function extractDates(text: string): { born: string | null; died: string | null; note: string | null } {
  let born: string | null = null;
  let died: string | null = null;
  let note: string | null = null;

  // "b. DATE" pattern
  const bornMatch = text.match(/b\.\s*([^;,)]+)/);
  if (bornMatch) {
    born = bornMatch[1].trim().replace(/\s+/g, " ");
    // Remove trailing location info if it starts with uppercase
    // but keep dates like "3 Jul 1927"
  }

  // "d. DATE" pattern
  const diedMatch = text.match(/d\.\s*([^;,)]+)/);
  if (diedMatch) {
    died = diedMatch[1].trim().replace(/\s+/g, " ");
  }

  // "m. DATE" (marriage) — show as note
  const marriageMatch = text.match(/m\.\s*([^;,)]+)/);
  if (marriageMatch && !born && !died) {
    note = `m. ${marriageMatch[1].trim()}`;
  }

  // Simple year range: (1784-1841)
  if (!born && !died) {
    const yearRange = text.match(/\((\d{4})-(\d{4})\)/);
    if (yearRange) {
      born = yearRange[1];
      died = yearRange[2];
    }
  }

  // Single year with comma: (1752, Place)
  if (!born) {
    const singleYear = text.match(/\((\d{4}),/);
    if (singleYear) born = singleYear[1];
  }

  // Approximate: (b. ~1805)
  if (!born) {
    const approx = text.match(/~(\d{4})/);
    if (approx) born = `~${approx[1]}`;
  }

  // ★ or ⚠️ markers
  const noteMatch = text.match(/[★⚠️]\s*(.+?)(?:\s*$)/);
  if (noteMatch) {
    note = noteMatch[1].replace(/[★⚠️]/g, "").trim();
  }

  return { born, died, note };
}

export function buildFamilyTree(): TreeNode {
  const treePath = path.join(VAULT_PATH, "Family_Tree.md");
  const content = fs.readFileSync(treePath, "utf-8");
  const slugIndex = buildSlugIndex();

  // Extract the ASCII tree block
  const treeMatch = content.match(/```\n([\s\S]+?)```/);
  if (!treeMatch) {
    return { name: "Family Tree", children: [] };
  }

  const treeLines = treeMatch[1].split("\n").filter((l) => l.trim());

  // Parse all lines
  const parsed: (LineInfo & { lineIndex: number })[] = [];
  for (let i = 0; i < treeLines.length; i++) {
    const info = parseLine(treeLines[i]);
    if (info) {
      parsed.push({ ...info, lineIndex: i });
    }
  }

  if (parsed.length === 0) return { name: "Family Tree", children: [] };

  // Build tree from parsed lines
  // The first line is the root (Chris Dover)
  const rootInfo = parsed[0];
  const rootFamily = "Dover";

  function makeNode(name: string, info: LineInfo, parentFamily: string): TreeNode {
    const familyLine = determineFamilyLine(name, parentFamily);
    const attributes: Record<string, string> = {};
    if (info.born) attributes.born = info.born;
    if (info.died) attributes.died = info.died;
    if (info.note) attributes.note = info.note;

    return {
      name,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      slug: findSlug(name, familyLine, slugIndex, info.born),
      familyLine,
      children: [],
    };
  }

  const root = makeNode(rootInfo.names[0], rootInfo, rootFamily);

  // Stack: tracks the current chain of ancestors by depth
  // Each entry: { node, depth, familyLine }
  const stack: { node: TreeNode; depth: number; familyLine: string }[] = [
    { node: root, depth: rootInfo.depth, familyLine: rootFamily },
  ];

  for (let i = 1; i < parsed.length; i++) {
    const info = parsed[i];

    // For lines with multiple names (e.g., "Thomas Dover + Ruth Fitch"),
    // the first person is the direct ancestor, the second is the spouse
    for (let nameIdx = 0; nameIdx < info.names.length; nameIdx++) {
      const name = info.names[nameIdx];
      const isSpouse = nameIdx > 0;

      // Pop stack until we find a proper parent (depth < current)
      while (stack.length > 1 && stack[stack.length - 1].depth >= info.depth) {
        stack.pop();
      }

      const parentEntry = stack[stack.length - 1];
      const node = makeNode(name, isSpouse ? { ...info, born: null, died: null, note: null } : info, parentEntry.familyLine);

      // If spouse, try to extract their own dates from the raw text
      if (isSpouse) {
        // Look for dates after the + sign
        const spousePart = info.rawText.split(/\s+\+\s+/).slice(nameIdx).join(" + ");
        const { born, died, note } = extractDates(spousePart);
        if (born || died || note) {
          const attrs: Record<string, string> = {};
          if (born) attrs.born = born;
          if (died) attrs.died = died;
          if (note) attrs.note = note;
          node.attributes = attrs;
        }
      }

      if (!parentEntry.node.children) parentEntry.node.children = [];
      parentEntry.node.children.push(node);

      // Only push the primary person (not spouse) onto the stack as potential parent
      if (!isSpouse) {
        stack.push({ node, depth: info.depth, familyLine: node.familyLine || parentEntry.familyLine });
      }
    }
  }

  // Graft deep lineage chains from Stories/Deepest_Lines.md
  graftDeepLines(root);

  return root;
}

/**
 * Find a node by name anywhere in the tree.
 * Returns the first match.
 */
function findNode(root: TreeNode, name: string): TreeNode | null {
  if (root.name === name) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNode(child, name);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Add the deep Pollicott and Billingsley lineage chains to the tree.
 * These are documented in Stories/Deepest_Lines.md with verified sources.
 */
function graftDeepLines(root: TreeNode) {
  // ─── POLLICOTT LINE ───
  // Mary Policot (b. 1662) married Edmund Dover (b. 1668)
  // She's already in the tree as a spouse of Edmund Dover.
  // We graft her ancestry: Mary ← Stephen ← Steven ← Francis ← Francis ← William ← ... ← Godfrey (d.1408)
  const maryPolicot = findNode(root, "Mary Policot");
  if (maryPolicot) {
    const pollicottChain: TreeNode = {
      name: "Stephen Policot",
      attributes: { born: "1630" },
      familyLine: "Dover",
      children: [],
    };

    // Build the chain bottom-up
    const stevenPollicot: TreeNode = {
      name: "Steven Pollicot",
      attributes: { born: "1594" },
      familyLine: "Dover",
      children: [pollicottChain],
    };

    const aneCoales: TreeNode = {
      name: "Ane Coales",
      attributes: { born: "1605" },
      familyLine: "Dover",
    };
    stevenPollicot.children!.push(aneCoales);

    const annWebster: TreeNode = {
      name: "Ann Webster",
      familyLine: "Dover",
    };
    pollicottChain.children!.push(annWebster);

    const francisPolicot2: TreeNode = {
      name: "Francis Policot",
      attributes: { born: "1558" },
      familyLine: "Dover",
      children: [stevenPollicot],
    };

    const margeriteCoxe: TreeNode = {
      name: "Margerite Coxe",
      attributes: { born: "1566", died: "1624" },
      familyLine: "Dover",
    };
    francisPolicot2.children!.push(margeriteCoxe);

    const francisPolicot1: TreeNode = {
      name: "Francis Policot",
      attributes: { born: "1536", died: "1592" },
      familyLine: "Dover",
      children: [francisPolicot2],
    };

    const joane: TreeNode = {
      name: "Joane",
      attributes: { born: "1538", died: "1583" },
      familyLine: "Dover",
    };
    francisPolicot1.children!.push(joane);

    const williamPolicot: TreeNode = {
      name: "William Policot",
      attributes: { born: "1514", note: "FamilySearch confirmed" },
      familyLine: "Dover",
      children: [francisPolicot1],
    };

    const alice: TreeNode = {
      name: "Alice",
      attributes: { born: "1514" },
      familyLine: "Dover",
    };
    williamPolicot.children!.push(alice);

    // Earlier Pollicotts (Warwick University research)
    const richardPollicott: TreeNode = {
      name: "Richard Pollicott",
      attributes: { died: "1545", note: "Warwick Univ. research" },
      familyLine: "Dover",
      children: [williamPolicot],
    };

    const johnPollicott3: TreeNode = {
      name: "John Pollicott",
      attributes: { died: "1544" },
      familyLine: "Dover",
      children: [richardPollicott],
    };

    const thomasPollicott: TreeNode = {
      name: "Thomas Pollicott",
      attributes: { died: "~1494" },
      familyLine: "Dover",
      children: [johnPollicott3],
    };

    const johnPollicott2: TreeNode = {
      name: "John Pollicott",
      attributes: { born: "~1400" },
      familyLine: "Dover",
      children: [thomasPollicott],
    };

    const johnPollicott1: TreeNode = {
      name: "John Pollicott",
      attributes: { died: "1434" },
      familyLine: "Dover",
      children: [johnPollicott2],
    };

    const godfreyPollicott: TreeNode = {
      name: "Godfrey Pollicott",
      attributes: { died: "1408", note: "EARLIEST — reign of Henry IV" },
      familyLine: "Dover",
      children: [johnPollicott1],
    };

    // Attach: Mary Policot's ancestors
    if (!maryPolicot.children) maryPolicot.children = [];
    maryPolicot.children.push(pollicottChain);
    // The chain goes: Mary ← Stephen ← Steven ← Francis ← Francis ← William ← Richard ← John ← Thomas ← John ← John ← Godfrey
    // But we need to attach it as ancestors (parent direction)
    // In this tree, children = ancestors (tree goes root=Chris → ancestors)
    // So we attach the deepest chain under Stephen Policot
    // Actually, the chain is already built correctly for the tree's direction
    // Let's restructure: attach the full chain under Mary
    maryPolicot.children = [godfreyPollicott];
    // No — the tree direction is: Chris at top, ancestors below (children = parents)
    // So Mary's "children" should be her parents (Stephen Policot + Ann Webster)
    // And Stephen's parents are Steven Pollicot + Ane Coales, etc.
    // Let me rebuild this correctly:

    maryPolicot.children = [{
      name: "Stephen Policot",
      attributes: { born: "1630" },
      familyLine: "Dover",
      children: [{
        name: "Steven Pollicot",
        attributes: { born: "1594" },
        familyLine: "Dover",
        children: [{
          name: "Francis Policot",
          attributes: { born: "1558" },
          familyLine: "Dover",
          children: [{
            name: "Francis Policot",
            attributes: { born: "1536", died: "1592" },
            familyLine: "Dover",
            children: [{
              name: "William Policot",
              attributes: { born: "1514", note: "FamilySearch confirmed" },
              familyLine: "Dover",
              children: [{
                name: "Richard Pollicott",
                attributes: { died: "1545", note: "Warwick Univ. research" },
                familyLine: "Dover",
                children: [{
                  name: "John Pollicott",
                  attributes: { died: "1544" },
                  familyLine: "Dover",
                  children: [{
                    name: "Thomas Pollicott",
                    attributes: { died: "~1494" },
                    familyLine: "Dover",
                    children: [{
                      name: "John Pollicott",
                      attributes: { born: "~1400" },
                      familyLine: "Dover",
                      children: [{
                        name: "John Pollicott",
                        attributes: { died: "1434" },
                        familyLine: "Dover",
                        children: [{
                          name: "Godfrey Pollicott",
                          attributes: { died: "1408", note: "EARLIEST ANCESTOR" },
                          familyLine: "Dover",
                        }],
                      }],
                    }],
                  }],
                }],
              }],
            }],
          }],
        }],
      }],
    }];
  }

  // ─── BILLINGSLEY LINE ───
  // Jessie Ellen Billingsley married Robert Darius Adams
  // She's already in the tree. Graft her ancestry back to Francis Billingsley (~1600)
  const jessieBillingsley = findNode(root, "Jessie Ellen Billingsley");
  if (jessieBillingsley) {
    jessieBillingsley.children = [{
      name: "Jesse Eugene Billingsley",
      attributes: { born: "1859", died: "1902", note: "died in Bisbee, AZ" },
      familyLine: "Adams",
      children: [{
        name: "Elijah Randolph Billingsley",
        attributes: { born: "1806", note: "Knoxville, TN to Orderville, UT" },
        familyLine: "Adams",
        children: [{
          name: "Jeptha Preston Billingsley",
          attributes: { born: "~1783", died: "1863" },
          familyLine: "Adams",
          children: [{
            name: "Samuel B. Billingsley",
            attributes: { born: "1747", died: "1816" },
            familyLine: "Adams",
            children: [{
              name: "James B. Billingsley Sr.",
              attributes: { born: "1726", died: "~1776" },
              familyLine: "Adams",
              children: [{
                name: "William Billingsley Jr.",
                attributes: { born: "1691", died: "~1745" },
                familyLine: "Adams",
                children: [{
                  name: "John Billingsley",
                  attributes: { born: "~1651", died: "1693", note: "Lost at sea" },
                  familyLine: "Adams",
                  children: [{
                    name: "Francis Billingsley",
                    attributes: { born: "~1600", died: "~1660", note: "COLONIAL MARYLAND — 1,250 acres" },
                    familyLine: "Adams",
                  }],
                }],
              }],
            }],
          }],
        }],
      }],
    }];
  }
}
