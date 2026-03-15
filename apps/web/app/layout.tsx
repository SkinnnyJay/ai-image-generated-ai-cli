import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Image AI — Prompt discovery",
  description: "Discover and use prompt templates for image generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <header
          style={{
            borderBottom: "1px solid #eee",
            padding: "12px 16px",
            position: "sticky",
            top: 0,
            background: "#fff",
            zIndex: 10,
          }}
        >
          <nav style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 12 }}>
            <Link
              href="/"
              style={{ color: "#111", textDecoration: "none", fontWeight: 700 }}
            >
              Prompt discovery
            </Link>
            <Link
              href="/artifacts"
              style={{ color: "#111", textDecoration: "none", fontWeight: 700 }}
            >
              Artifacts sandbox
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
