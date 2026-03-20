"use client";

import { useCallback, useState, useMemo } from "react";
import Tree from "react-d3-tree";
import type { TreeNode } from "@/lib/types";
import { useRouter } from "next/navigation";

interface FamilyTreeProps {
  data: TreeNode;
}

/* Deuteranopia-safe family colors — used inline since SVG can't read CSS vars easily */
const FAMILY_COLORS_LIGHT: Record<string, string> = {
  Dover: "#8b6a2f", Houghton: "#2d6da3", Jensen: "#1a7a6d",
  Adams: "#a03e64", Lowe: "#6b4e9e", Other: "#888888",
};
const FAMILY_COLORS_DARK: Record<string, string> = {
  Dover: "#d4a564", Houghton: "#5b9bd5", Jensen: "#2bafa0",
  Adams: "#c75b8a", Lowe: "#9b7ec9", Other: "#707070",
};

function getThemeColors() {
  if (typeof document === "undefined") return { dark: false, colors: FAMILY_COLORS_LIGHT };
  const dark = document.documentElement.classList.contains("dark");
  return { dark, colors: dark ? FAMILY_COLORS_DARK : FAMILY_COLORS_LIGHT };
}

function renderNode({
  nodeDatum,
  toggleNode,
  onNodeClick,
  themeColors,
  isDark,
}: {
  nodeDatum: TreeNode & { __rd3t?: { collapsed?: boolean } };
  toggleNode: () => void;
  onNodeClick: (slug: string) => void;
  themeColors: Record<string, string>;
  isDark: boolean;
}) {
  const color = themeColors[nodeDatum.familyLine || "Other"] || themeColors.Other;
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
    : died
      ? `d. ${died}`
      : note || "";

  const bgColor = isDark ? (hasPage ? "#252018" : "#1e1e1e") : (hasPage ? "#faf6f0" : "#ffffff");
  const borderColor = isDark ? "#383838" : "#d4cfc7";
  const mutedColor = isDark ? "#a0a0a0" : "#888888";

  return (
    <g>
      <foreignObject x={-100} y={-38} width={200} height={90}>
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            borderTop: `1.5px solid ${borderColor}`,
            borderRight: `1.5px solid ${borderColor}`,
            borderBottom: `1.5px solid ${borderColor}`,
            borderLeft: `4px solid ${color}`,
            background: bgColor,
            cursor: hasPage ? "pointer" : "default",
            textAlign: "center",
            minWidth: 140,
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (hasPage) onNodeClick(nodeDatum.slug!);
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.3,
              color,
              textDecorationLine: hasPage ? "underline" : "none",
              textDecorationColor: `${color}80`,
              textUnderlineOffset: 3,
            }}
          >
            {nodeDatum.name}
          </div>
          {dateStr && (
            <div style={{ marginTop: 3, fontSize: 12, color: mutedColor }}>
              {dateStr}
            </div>
          )}
          {hasPage && (
            <div style={{ marginTop: 2, fontSize: 11, color: `${color}cc`, fontWeight: 600 }}>
              Tap to read
            </div>
          )}
        </div>
      </foreignObject>
      {hasChildren && (
        <g
          onClick={(e) => { e.stopPropagation(); toggleNode(); }}
          className="cursor-pointer"
        >
          <circle cx={0} cy={55} r={14} fill={bgColor} stroke={color} strokeWidth={2} />
          <text x={0} y={60} textAnchor="middle" fill={color} fontSize="16" fontWeight="bold">
            {isCollapsed ? "+" : "\u2212"}
          </text>
        </g>
      )}
    </g>
  );
}

export default function FamilyTree({ data }: FamilyTreeProps) {
  const router = useRouter();
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">("vertical");
  const [depth, setDepth] = useState<number | undefined>(undefined);

  const { dark: isDark, colors: themeColors } = useMemo(getThemeColors, []);

  const handleNodeClick = useCallback(
    (slug: string) => { router.push(`/person/${slug}/`); },
    [router]
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button onClick={() => setOrientation((o) => o === "vertical" ? "horizontal" : "vertical")} className="btn-secondary text-sm">
          {orientation === "vertical" ? "Horizontal View" : "Vertical View"}
        </button>
        <button onClick={() => setDepth(depth === undefined ? 3 : undefined)} className="btn-secondary text-sm">
          {depth === undefined ? "Collapse to 3 levels" : "Expand all"}
        </button>
        <div className="flex flex-wrap gap-3 text-sm">
          {Object.entries(themeColors).map(([family, color]) =>
            family !== "Other" ? (
              <span key={family} className="family-indicator">
                <span className="family-dot" style={{ background: color }} aria-hidden="true" />
                {family}
              </span>
            ) : null
          )}
        </div>
        <span className="text-sm" style={{ color: "var(--text-low-emphasis)" }}>
          Underlined names link to person pages
        </span>
      </div>

      <div
        style={{ width: "100%", height: "calc(100vh - 12rem)", background: "var(--tree-bg)" }}
        className="rounded-xl"
      >
        <Tree
          data={data}
          orientation={orientation}
          pathFunc="step"
          translate={{ x: orientation === "vertical" ? 500 : 250, y: 60 }}
          separation={{ siblings: 1.3, nonSiblings: 1.6 }}
          nodeSize={{ x: 230, y: 120 }}
          renderCustomNodeElement={(rd3tProps) =>
            renderNode({
              nodeDatum: rd3tProps.nodeDatum as TreeNode & { __rd3t?: { collapsed?: boolean } },
              toggleNode: rd3tProps.toggleNode,
              onNodeClick: handleNodeClick,
              themeColors,
              isDark,
            })
          }
          collapsible
          initialDepth={depth}
          zoomable
          draggable
          pathClassFunc={() => "stroke-surface-border"}
        />
      </div>
    </div>
  );
}
