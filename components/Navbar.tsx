"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "\u2302" },
  { href: "/tree/", label: "Family Tree", icon: "\u{1F333}" },
  { href: "/timeline/", label: "Timeline", icon: "\u{1F4C5}" },
  { href: "/map/", label: "Map", icon: "\u{1F5FA}" },
  { href: "/stories/", label: "Stories", icon: "\u{1F4D6}" },
  { href: "/search/", label: "Search", icon: "\u{1F50D}" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-sm"
      style={{
        borderBottom: "1px solid var(--surface-border)",
        background: "rgba(18, 18, 18, 0.95)",
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
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

          <ul className="flex gap-1" role="list">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-lg px-3 py-2 text-base font-medium transition-colors"
                    style={{
                      minHeight: "44px",
                      minWidth: "auto",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      color: isActive
                        ? "var(--action-primary)"
                        : "var(--text-medium-emphasis)",
                      background: isActive
                        ? "rgba(212, 165, 116, 0.12)"
                        : "transparent",
                    }}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="hidden sm:inline" aria-hidden="true">
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
