"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/tree/", label: "Family Tree" },
  { href: "/timeline/", label: "Timeline" },
  { href: "/map/", label: "Map" },
  { href: "/stories/", label: "Stories" },
  { href: "/search/", label: "Search" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-sm"
      style={{
        borderBottom: "2px solid var(--surface-border)",
        background: "var(--nav-bg)",
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-2">
          <Link
            href="/"
            className="text-lg font-bold"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--action-primary)",
              minHeight: "auto",
            }}
            aria-label="Dover-Houghton Family History — Home"
          >
            Dover-Houghton
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-2 py-2 text-base font-medium transition-colors sm:px-3"
                  style={{
                    minHeight: "48px",
                    minWidth: "auto",
                    display: "inline-flex",
                    alignItems: "center",
                    color: isActive
                      ? "var(--action-primary)"
                      : "var(--text-medium-emphasis)",
                    background: isActive
                      ? "var(--surface-elevated)"
                      : "transparent",
                  }}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
