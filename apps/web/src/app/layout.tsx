import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conjure — AI Prompt Builder",
  description:
    "Craft perfect image generation prompts with AI. Built for Midjourney, FLUX, and DALL·E.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
