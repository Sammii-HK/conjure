"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Trash2,
  ArrowUpRight,
  Star,
  Loader2,
  Copy,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { readLocalPrompts } from "@/lib/local-library";
import { favouriteSaved, removeSaved } from "@/lib/library-client";
import type { SavedPrompt } from "@/types";
export function Library() {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]),
    [loading, setLoading] = useState(true),
    [search, setSearch] = useState(""),
    [account, setAccount] = useState(""),
    [rating, setRating] = useState("all"),
    [favourites, setFavourites] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [pending, setPending] = useState<string | null>(null),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    let local: SavedPrompt[] = [];
    try {
      local = readLocalPrompts(localStorage);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "This browser’s saved prompts could not be read.",
      );
    }
    setPrompts(local);
    void (async () => {
      try {
        const response = await fetch("/api/prompts", {
          signal: controller.signal,
        });
        if (response.status === 401) return;
        if (!response.ok)
          throw new Error(
            "The account library is unavailable. Browser saves are still shown.",
          );
        const data = await response.json();
        if (!Array.isArray(data))
          throw new Error(
            "The account library returned an incomplete response.",
          );
        if (active)
          setPrompts([
            ...local,
            ...data.map((item) => ({ ...item, storage: "account" as const })),
          ]);
      } catch (cause) {
        if (active && !controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "The account library could not load. Browser saves are still shown.",
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [refresh]);
  async function change(prompt: SavedPrompt, kind: "favourite" | "remove") {
    if (pending) return;
    setPending(prompt.id);
    setError("");
    try {
      if (kind === "remove") {
        await removeSaved(prompt);
        setPrompts((current) =>
          current.filter((item) => item.id !== prompt.id),
        );
        setNotice("Prompt removed from this library.");
      } else {
        const next = await favouriteSaved(prompt);
        setPrompts((current) =>
          current.map((item) => (item.id === prompt.id ? next : item)),
        );
        setNotice(
          next.favourite ? "Added to favourites." : "Removed from favourites.",
        );
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your library change could not be saved.",
      );
    } finally {
      setPending(null);
    }
  }
  async function copy(prompt: SavedPrompt) {
    setError("");
    try {
      await navigator.clipboard.writeText(prompt.output);
      setNotice("Prompt copied.");
    } catch {
      setError(
        "Copy is unavailable. Select the prompt text and copy it manually.",
      );
    }
  }
  const filtered = prompts.filter((prompt) => {
    const session = prompt.iteration.session;
    return (
      (!account || session.account === account) &&
      (rating === "all" || prompt.rating === (rating === "good" ? 1 : -1)) &&
      (!favourites || prompt.favourite) &&
      (!search.trim() ||
        (prompt.output + " " + session.brief)
          .toLowerCase()
          .includes(search.trim().toLowerCase()))
    );
  });
  const accounts = [
    ...new Set(
      prompts
        .map((prompt) => prompt.iteration.session.account)
        .filter((value): value is string => !!value),
    ),
  ];
  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-text-muted">
        Prompts you save are kept in this browser.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[min(100%,16rem)] flex-1 space-y-2 text-xs text-text-muted">
          Search your prompts
          <span className="relative block">
            <Search
              size={16}
              aria-hidden
              className="absolute left-3 top-1/2 -translate-y-1/2"
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="A phrase, subject or original brief"
              className="pl-9"
            />
          </span>
        </label>
        {accounts.length > 0 && (
          <label className="space-y-2 text-xs text-text-muted">
            Style profile
            <select
              value={account}
              onChange={(event) => setAccount(event.target.value)}
              className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm text-text"
            >
              <option value="">All profiles</option>
              {accounts.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        )}
        <label className="space-y-2 text-xs text-text-muted">
          Rating
          <select
            value={rating}
            onChange={(event) => setRating(event.target.value)}
            className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm text-text"
          >
            <option value="all">All ratings</option>
            <option value="good">Liked</option>
            <option value="bad">Disliked</option>
          </select>
        </label>
        <Button
          variant={favourites ? "primary" : "secondary"}
          aria-pressed={favourites}
          onClick={() => setFavourites(!favourites)}
        >
          <Star size={16} aria-hidden />
          Favourites
        </Button>
        <Button
          variant="ghost"
          aria-label="Refresh library"
          onClick={() => setRefresh((value) => value + 1)}
        >
          <RefreshCw size={16} aria-hidden />
        </Button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-800/50 bg-red-950/30 p-4 text-sm text-red-200"
        >
          {error}
        </p>
      )}
      <p role="status" className="text-xs text-text-muted">
        {notice ||
          `${filtered.length} ${filtered.length === 1 ? "prompt" : "prompts"} shown`}
      </p>
      {loading && (
        <p className="flex items-center gap-2 text-sm text-text-muted">
          <Loader2
            size={16}
            aria-hidden
            className="animate-spin motion-reduce:animate-none"
          />
          Loading your library…
        </p>
      )}
      {!loading && !filtered.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12">
          <h2 className="text-xl font-semibold">
            {prompts.length
              ? "No prompts match this view."
              : "Keep the directions worth returning to."}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-muted">
            {prompts.length
              ? "Try a different phrase, rating or profile."
              : "Your library starts with a saved prompt. Create a few directions, save what works and come back here to remix it."}
          </p>
          {prompts.length ? (
            <Button
              variant="secondary"
              className="mt-5"
              onClick={() => {
                setSearch("");
                setAccount("");
                setRating("all");
                setFavourites(false);
              }}
            >
              Clear filters
            </Button>
          ) : (
            <Link
              href="/"
              className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm text-violet-300"
            >
              Open the prompt studio <ArrowUpRight size={16} aria-hidden />
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((prompt) => (
            <article
              key={prompt.id}
              className="rounded-2xl border border-border bg-card p-5 sm:p-6"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={prompt.label}>
                    {prompt.label === "safe" ? "Straightforward" : prompt.label}
                  </Badge>
                  <Badge>{prompt.iteration.session.platform}</Badge>
                  <span className="text-xs text-text-muted">
                    {prompt.storage === "browser"
                      ? "On this browser"
                      : "Account library"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={
                      prompt.favourite ? "Remove favourite" : "Add favourite"
                    }
                    aria-pressed={prompt.favourite}
                    disabled={!!pending}
                    onClick={() => void change(prompt, "favourite")}
                  >
                    <Star
                      size={16}
                      fill={prompt.favourite ? "currentColor" : "none"}
                      aria-hidden
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Copy saved prompt"
                    onClick={() => void copy(prompt)}
                  >
                    <Copy size={16} aria-hidden />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    aria-label="Remove prompt from library"
                    disabled={!!pending}
                    onClick={() => void change(prompt, "remove")}
                  >
                    {pending === prompt.id ? (
                      <Loader2
                        size={16}
                        className="animate-spin motion-reduce:animate-none"
                        aria-hidden
                      />
                    ) : (
                      <Trash2 size={16} aria-hidden />
                    )}
                  </Button>
                </div>
              </div>
              {prompt.iteration.refinement && (
                <p className="mb-3 text-xs text-violet-300">
                  Refinement: {prompt.iteration.refinement}
                </p>
              )}
              <p className="break-words whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {prompt.output}
              </p>
              <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
                <p className="min-w-0 max-w-xl flex-1 text-xs leading-relaxed text-text-muted">
                  Original brief: {prompt.iteration.session.brief}
                </p>
                <Link
                  href={`/?${new URLSearchParams({ brief: prompt.iteration.session.brief, base: prompt.output }).toString()}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-violet-300"
                >
                  Remix this prompt <ArrowUpRight size={16} aria-hidden />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
