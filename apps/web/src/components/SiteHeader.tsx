"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Wand2 } from "lucide-react";
export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-3 rounded-lg font-semibold tracking-tight"
        >
          <span className="rounded-lg bg-accent/15 p-2 text-violet-300">
            <Wand2 size={19} aria-hidden />
          </span>
          Conjure
          <span className="rounded-full border border-border px-2 py-1 text-[10px] font-normal uppercase tracking-widest text-text-muted">
            Prompt studio
          </span>
        </Link>
        <nav aria-label="Main navigation" className="flex gap-2 text-sm">
          <Link
            href="/"
            aria-current={path === "/" ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-lg px-3 ${path === "/" ? "bg-card text-text" : "text-text-muted hover:text-text"}`}
          >
            Create
          </Link>
          <Link
            href="/library"
            aria-current={path === "/library" ? "page" : undefined}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 ${path === "/library" ? "bg-card text-text" : "text-text-muted hover:text-text"}`}
          >
            <BookOpen size={16} aria-hidden />
            Library
          </Link>
        </nav>
      </div>
    </header>
  );
}
