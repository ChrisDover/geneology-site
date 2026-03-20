export interface Person {
  slug: string;
  filePath: string;
  name: string;
  born: string | null;
  bornYear: number | null;
  died: string | null;
  diedYear: number | null;
  family: string;
  confidence: string;
  sources: string[];
  tags: string[];
  birthPlace: string | null;
  deathPlace: string | null;
  burialPlace: string | null;
  occupation: string | null;
  locations: LocationEvent[];
  parents: RelationLink[];
  spouses: RelationLink[];
  children: RelationLink[];
  bodyHtml: string;
  relationshipToChris: string | null;
}

export interface RelationLink {
  name: string;
  slug: string | null;
  detail: string;
}

export interface LocationEvent {
  place: string;
  date: string | null;
  lat: number;
  lng: number;
  eventType: string;
  personSlug: string;
  personName: string;
  familyLine: string;
}

export interface TimelineEvent {
  date: string;
  sortKey: number;
  event: string;
  persons: string;
  personSlugs: string[];
  location: string;
  source: string;
  era: string;
}

export interface Story {
  slug: string;
  title: string;
  tags: string[];
  person: string | null;
  bodyHtml: string;
  excerpt: string;
}

export interface TreeNode {
  name: string;
  attributes?: Record<string, string>;
  slug?: string;
  familyLine?: string;
  children?: TreeNode[];
}

export interface SearchEntry {
  type: "person" | "story";
  slug: string;
  title: string;
  family: string;
  tags: string[];
  born: string | null;
  died: string | null;
  birthPlace: string | null;
  excerpt: string;
}
