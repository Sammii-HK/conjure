import Link from "next/link";
import { BookOpen, Wand2 } from "lucide-react";
import { PromptBuilder } from "@/components/PromptBuilder";

interface SearchParams {
  brief?: string;
  base?: string;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

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
            href="/library"
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Library
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-text mb-2">
            Conjure the perfect prompt
          </h1>
          <p className="text-text-muted">
            Describe your vision and get 3 Midjourney-ready variations, instantly.
          </p>
        </div>

        <PromptBuilder
          initialBrief={params.brief ?? ""}
          initialPrompt={params.base ?? ""}
        />
      </main>
    </div>
  );
}
