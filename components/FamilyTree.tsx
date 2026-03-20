"use client";

import { useCallback, useState, useMemo } from "react";
import Tree from "react-d3-tree";
import type { TreeNode } from "@/lib/types";
import { useRouter } from "next/navigation";

interface FamilyTreeProps {
  data: TreeNode;
}

/* Deuteranopia-safe family colors */
const FAMILY_COLORS: Record<string, string> = {
  Dover: "#d4a564",
  Houghton: "#5b9bd5",
  Jensen: "#2bafa0",
  Adams: "#c75b8a",
  Lowe: "#9b7ec9",
  Other: "#707070",
};

function renderNode({
  nodeDatum,
  toggleNode,
  onNodeClick,
}: {
  nodeDatum: TreeNode & { __rd3t?: { collapsed?: boolean } };
  toggleNode: () => void;
  onNodeClick: (slug: string) => void;
}) {
  const color = FAMILY_COLORS[nodeDatum.familyLine || "Other"] || "#888";
  const hasChildren = nodeDatum.children && nodeDatum.children.length > 0;
  const isCollapsed = nodeDatum.__rd3t?.collapsed;
  const hasPage = !!nodeDatum.slug;

  const born = nodeDatum.attributes?.born || "";
  const died = nodeDatum.attributes?.died || "";
  const note = nodeDatum.attributes?.note || "";
  const dateStr = born
    ? died
      ? `${born} \u2013 ${died}`
      : `b. ${born}`
    : note || "";

  return (
    <g>
      <foreignObject x={-90} y={-32} width={180} height={76}>
        <div
          style={{
            padding: "5px 10px",
            borderRadius: 6,
            borderTop: `1.5px solid ${hasPage ? color : "#383838"}`,
            borderRight: `1.5px solid ${hasPage ? color : "#383838"}`,
            borderBottom: `1.5px solid ${hasPage ? color : "#383838"}`,
            borderLeft: `3px solid ${color}`,
            background: hasPage ? "#1e1e1e" : "#1e1e1e",
            cursor: hasPage ? "pointer" : "default",
            textAlign: "center",
            minWidth: 130,
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            if (hasPage) {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderTopColor = color;
              el.style.borderRightColor = color;
              el.style.borderBottomColor = color;
              el.style.boxShadow = `0 0 12px ${color}40`;
            }
          }}
          onMouseLeave={(e) => {
            if (hasPage) {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderTopColor = "#383838";
              el.style.borderRightColor = "#383838";
              el.style.borderBottomColor = "#383838";
              el.style.boxShadow = "none";
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (hasPage) onNodeClick(nodeDatum.slug!);
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              lineHeight: 1.3,
              color: color,
              textDecorationLine: hasPage ? "underline" : "none",
              textDecorationColor: `${color}60`,
              textUnderlineOffset: 2,
            }}
          >
            {nodeDatum.name}
          </div>
          {dateStr && (
            <div style={{ marginTop: 2, fontSize: 9, color: "#a0a0a0" }}>
              {dateStr}
            </div>
          )}
          {hasPage && (
            <div style={{ marginTop: 1, fontSize: 8, color: `${color}80` }}>
              View story &rarr;
            </div>
          )}
        </div>
      </foreignObject>
      {/* Expand/collapse button */}
      {hasChildren && (
        <g
          onClick={(e) => {
            e.stopPropagation();
            toggleNode();
          }}
          className="cursor-pointer"
        >
          <circle
            cx={0}
            cy={47}
            r={9}
            fill="#1e1e1e"
            stroke={color}
            strokeWidth={1.5}
          />
          <text
            x={0}
            y={51}
            textAnchor="middle"
            fill={color}
            fontSize="13"
            fontWeight="bold"
          >
            {isCollapsed ? "+" : "\u2212"}
          </text>
        </g>
      )}
    </g>
  );
}

export default function FamilyTree({ data }: FamilyTreeProps) {
  const router = useRouter();
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">(
    "vertical"
  );
  const [depth, setDepth] = useState<number | undefined>(undefined);

  const handleNodeClick = useCallback(
    (slug: string) => {
      router.push(`/person/${slug}/`);
    },
    [router]
  );

  const containerStyle = useMemo(
    () => ({
      width: "100%",
      height: "calc(100vh - 10rem)",
      background: "#121212",
    }),
    []
  );

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() =>
            setOrientation((o) =>
              o === "vertical" ? "horizontal" : "vertical"
            )
          }
          className="rounded border border-card-border bg-card-bg px-3 py-1.5 text-sm text-muted transition-colors hover:text-accent"
        >
          {orientation === "vertical"
            ? "Horizontal View"
            : "Vertical View"}
        </button>
        <button
          onClick={() => setDepth(depth === undefined ? 3 : undefined)}
          className="rounded border border-card-border bg-card-bg px-3 py-1.5 text-sm text-muted transition-colors hover:text-accent"
        >
          {depth === undefined ? "Collapse to 3 levels" : "Expand all"}
        </button>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(FAMILY_COLORS).map(([family, color]) =>
            family !== "Other" ? (
              <span key={family} className="flex items-center gap-1">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: color }}
                />
                {family}
              </span>
            ) : null
          )}
        </div>
        <span className="text-xs text-muted">
          Underlined names link to person pages
        </span>
      </div>

      <div
        style={containerStyle}
        className="rounded-lg border border-card-border"
      >
        <Tree
          data={data}
          orientation={orientation}
          pathFunc="step"
          translate={{
            x: orientation === "vertical" ? 500 : 250,
            y: 60,
          }}
          separation={{ siblings: 1.2, nonSiblings: 1.5 }}
          nodeSize={{ x: 210, y: 110 }}
          renderCustomNodeElement={(rd3tProps) =>
            renderNode({
              nodeDatum: rd3tProps.nodeDatum as TreeNode & {
                __rd3t?: { collapsed?: boolean };
              },
              toggleNode: rd3tProps.toggleNode,
              onNodeClick: handleNodeClick,
            })
          }
          collapsible
          initialDepth={depth}
          zoomable
          draggable
          pathClassFunc={() => "stroke-card-border"}
        />
      </div>
    </div>
  );
}
