import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Conjure: image prompt studio",
  description:
    "Explore three image-prompt directions, refine a brief and keep your favourites for Midjourney, FLUX and DALL·E.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-3"
        >
          Skip to content
        </a>
        <SiteHeader />
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
