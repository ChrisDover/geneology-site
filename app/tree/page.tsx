import FamilyTreeWrapper from "@/components/FamilyTreeWrapper";
import { buildFamilyTree } from "@/lib/tree-builder";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Family Tree",
  description: "Interactive family tree spanning 10+ generations",
};

export default function TreePage() {
  const treeData = buildFamilyTree();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 font-[family-name:var(--font-serif)] text-3xl font-bold text-accent">
        Family Tree
      </h1>
      <p className="mb-6 text-sm text-muted">
        Click a node to view details. Click +/- to expand or collapse branches.
        Drag to pan, scroll to zoom.
      </p>
      <FamilyTreeWrapper data={treeData} />
    </div>
  );
}
