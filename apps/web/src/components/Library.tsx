"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Trash2, ExternalLink, Star, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { SavedPrompt, PromptLabel } from "@/types";

const LABEL_VARIANT: Record<string, "safe" | "creative" | "experimental"> = {
  safe: "safe",
  creative: "creative",
  experimental: "experimental",
};

export function Library() {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAccount, setFilterAccount] = useState("");
  const [filterRating, setFilterRating] = useState<"all" | "good" | "bad">("all");
  const [filterFavourites, setFilterFavourites] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterAccount) params.set("account", filterAccount);
      if (filterRating !== "all") params.set("rating", filterRating);
      if (filterFavourites) params.set("favourites", "true");

      const res = await fetch(`/api/prompts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPrompts(data);
      }
    } finally {
      setLoading(false);
    }
  }, [filterAccount, filterRating, filterFavourites]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/prompts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPrompts((prev) => prev.filter((p) => p.id !== id));
      }
    } finally {
      setDeleting(null);
    }
  }

  async function handleUseAsBase(prompt: SavedPrompt) {
    const params = new URLSearchParams({
      brief: prompt.iteration.session.brief,
      base: prompt.output,
    });
    window.location.href = `/?${params.toString()}`;
  }

  const filtered = prompts.filter((p) => {
    if (!search) return true;
    return (
      p.output.toLowerCase().includes(search.toLowerCase()) ||
      p.iteration.session.brief.toLowerCase().includes(search.toLowerCase())
    );
  });

  const accounts = [...new Set(prompts.map((p) => p.iteration.session.account).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts..."
              className="pl-9"
            />
          </div>
        </div>

        {accounts.length > 0 && (
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent/50 focus:outline-none"
          >
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a} value={a ?? ""}>
                {a}
              </option>
            ))}
          </select>
        )}

        <select
          value={filterRating}
          onChange={(e) => setFilterRating(e.target.value as typeof filterRating)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent/50 focus:outline-none"
        >
          <option value="all">All ratings</option>
          <option value="good">Liked</option>
          <option value="bad">Disliked</option>
        </select>

        <Button
          variant={filterFavourites ? "primary" : "secondary"}
          size="md"
          onClick={() => setFilterFavourites(!filterFavourites)}
        >
          <Star className="h-4 w-4" />
          Favourites
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-text-muted">
            {prompts.length === 0
              ? "No saved prompts yet. Generate some and save the ones you like!"
              : "No prompts match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((prompt) => (
            <div
              key={prompt.id}
              className="rounded-xl border border-border bg-card p-4 group hover:border-accent/30 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={LABEL_VARIANT[prompt.label as PromptLabel] ?? "default"}>
                    {prompt.label}
                  </Badge>
                  {prompt.iteration.session.account && (
                    <Badge variant="account">
                      {prompt.iteration.session.account}
                    </Badge>
                  )}
                  <Badge>{prompt.iteration.session.platform}</Badge>
                  {prompt.rating === 1 && (
                    <span className="text-xs text-emerald-400">Liked</span>
                  )}
                  {prompt.rating === -1 && (
                    <span className="text-xs text-red-400">Disliked</span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUseAsBase(prompt)}
                    title="Use as base for a new prompt"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Remix
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(prompt.id)}
                    disabled={deleting === prompt.id}
                  >
                    {deleting === prompt.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {prompt.iteration.refinement && (
                <p className="text-xs text-accent/80 mb-2 italic">
                  Refined: "{prompt.iteration.refinement}"
                </p>
              )}

              <p className="text-sm text-text leading-relaxed font-mono whitespace-pre-wrap break-words">
                {prompt.output}
              </p>

              <p className="mt-2 text-xs text-text-muted/60 truncate">
                Brief: {prompt.iteration.session.brief}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
