import Link from "next/link";
import { Wand2, ArrowLeft } from "lucide-react";
import { Library } from "@/components/Library";

export default function LibraryPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f" }}>
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-accent" />
            <span className="font-semibold text-text">Conjure</span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Builder
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text mb-1">Library</h1>
          <p className="text-text-muted text-sm">Your saved prompts, organised and ready to remix.</p>
        </div>

        <Library />
      </main>
    </div>
  );
}
