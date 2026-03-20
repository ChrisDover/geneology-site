"use client";

import dynamic from "next/dynamic";
import type { LocationEvent } from "@/lib/types";

const MigrationMap = dynamic(() => import("@/components/MigrationMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center text-muted">
      Loading map...
    </div>
  ),
});

export default function MigrationMapWrapper({
  locations,
}: {
  locations: LocationEvent[];
}) {
  return <MigrationMap locations={locations} />;
}
