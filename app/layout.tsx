import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Dover-Houghton Family History",
    template: "%s | Dover-Houghton",
  },
  description:
    "An interactive genealogy spanning 608+ years, 6 countries, and 35+ surnames — from medieval England to the American West.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap"
        />
        {/* Flash-free theme init — runs before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" className="flex-1" role="main">
          {children}
        </main>
        <footer
          className="border-t py-8 text-center"
          style={{
            borderColor: "var(--surface-border)",
            color: "var(--text-medium-emphasis)",
          }}
          role="contentinfo"
        >
          <p className="text-base">Dover-Houghton Family History</p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-low-emphasis)" }}>
            Nearly 1,000 years of family history across 6 countries
          </p>
        </footer>
      </body>
    </html>
  );
}
