import MigrationMapWrapper from "@/components/MigrationMapWrapper";
import { getAllLocations } from "@/lib/parser";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Migration Map",
  description: "Follow the family journeys across continents",
};

export default async function MapPage() {
  const locations = await getAllLocations();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 font-[family-name:var(--font-serif)] text-3xl font-bold text-accent">
        Migration Map
      </h1>
      <p className="mb-6 text-sm text-muted">
        Tracing family movements from England, Scotland, and Denmark to the
        American West. Dashed lines show migration paths.
      </p>
      <MigrationMapWrapper locations={locations} />
    </div>
  );
}
