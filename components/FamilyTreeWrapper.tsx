"use client";

import dynamic from "next/dynamic";
import type { TreeNode } from "@/lib/types";

const FamilyTree = dynamic(() => import("@/components/FamilyTree"), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center text-muted">
      Loading tree...
    </div>
  ),
});

export default function FamilyTreeWrapper({ data }: { data: TreeNode }) {
  return <FamilyTree data={data} />;
}
