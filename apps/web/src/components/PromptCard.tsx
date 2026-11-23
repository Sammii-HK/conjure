"use client";
import { useState } from "react";
import {
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { saveVariation, rateSaved } from "@/lib/library-client";
import type { PromptContext } from "@/lib/local-library";
import type { PromptVariation, SavedPrompt } from "@/types";
export function PromptCard({
  variation,
  sessionId,
  iterationId,
  context,
  storage,
  refinementText,
  isRefining,
  disabled,
  onRefinementChange,
  onRefine,
}: {
  variation: PromptVariation;
  sessionId: string | null;
  iterationId: string | null;
  context: PromptContext;
  storage: "browser" | "account";
  refinementText: string;
  isRefining: boolean;
  disabled: boolean;
  onRefinementChange: (text: string) => void;
  onRefine: () => void;
}) {
  const [saved, setSaved] = useState<SavedPrompt | null>(null),
    [pending, setPending] = useState(false),
    [copied, setCopied] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [showRefine, setShowRefine] = useState(false);
  async function copy() {
    setError("");
    try {
      await navigator.clipboard.writeText(variation.prompt);
      setCopied(true);
      setNotice("Prompt copied.");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError(
        "Copy is unavailable. Select the prompt text and copy it manually.",
      );
    }
  }
  async function save(rating?: number | null) {
    if (!iterationId || pending) return;
    setPending(true);
    setError("");
    try {
      let prompt =
        saved ??
        (await saveVariation({ storage, iterationId, variation, context }));
      setSaved(prompt);
      if (rating !== undefined) prompt = await rateSaved(prompt, rating);
      setSaved(prompt);
      setNotice(
        storage === "browser"
          ? "Saved to your library."
          : "Saved to your library.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your prompt could not be saved. Copy it to keep it elsewhere.",
      );
    } finally {
      setPending(false);
    }
  }
  const title = {
    safe: "A clear starting point",
    creative: "An artistic interpretation",
    experimental: "A bolder departure",
  }[variation.label];
  const action =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-border hover:text-text disabled:opacity-40";
  return (
    <article className="rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant={variation.label}>
            {variation.label === "safe" ? "Straightforward" : variation.label}
          </Badge>
          <h3 className="mt-2 text-sm font-medium">{title}</h3>
        </div>
        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label={`${variation.label} prompt actions`}
        >
          <button
            type="button"
            className={`${action} ${saved?.rating === 1 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "hover:text-emerald-700 dark:hover:text-emerald-400"}`}
            title="Good prompt"
            aria-label="Like this prompt"
            aria-pressed={saved?.rating === 1}
            disabled={pending}
            onClick={() => void save(saved?.rating === 1 ? null : 1)}
          >
            <ThumbsUp size={16} aria-hidden />
          </button>
          <button
            type="button"
            className={`${action} ${saved?.rating === -1 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "hover:text-red-700 dark:hover:text-red-400"}`}
            title="Not great"
            aria-label="Dislike this prompt"
            aria-pressed={saved?.rating === -1}
            disabled={pending}
            onClick={() => void save(saved?.rating === -1 ? null : -1)}
          >
            <ThumbsDown size={16} aria-hidden />
          </button>
          <button
            type="button"
            className={`${action} ${saved ? "text-accent-text" : "hover:text-accent-text"}`}
            title={saved ? "Saved to library" : "Save to library"}
            aria-label={saved ? "Prompt saved" : "Save prompt"}
            disabled={pending || !!saved || !iterationId}
            onClick={() => void save()}
          >
            {pending ? (
              <Loader2
                size={16}
                className="animate-spin motion-reduce:animate-none"
                aria-hidden
              />
            ) : saved ? (
              <BookmarkCheck size={16} aria-hidden />
            ) : (
              <Bookmark size={16} aria-hidden />
            )}
          </button>
          <button
            type="button"
            className={`${action} ${copied ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : ""}`}
            title="Copy to clipboard"
            aria-label="Copy prompt"
            onClick={() => void copy()}
          >
            {copied ? (
              <Check size={16} aria-hidden />
            ) : (
              <Copy size={16} aria-hidden />
            )}
          </button>
        </div>
      </div>
      <p className="break-words whitespace-pre-wrap font-mono text-sm leading-relaxed text-text">
        {variation.prompt}
      </p>
      <p role="status" className="mt-3 min-h-4 text-xs text-text-muted">
        {notice ||
          "Save it, or copy it into your image tool."}
      </p>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      {sessionId && (
        <div className="mt-4 border-t border-border pt-3">
          <button
            type="button"
            disabled={disabled}
            aria-expanded={showRefine}
            className="inline-flex min-h-11 items-center gap-2 text-sm text-text-muted hover:text-text"
            onClick={() => setShowRefine(!showRefine)}
          >
            <RefreshCw size={14} aria-hidden />
            Refine this direction
            {showRefine ? (
              <ChevronUp size={14} aria-hidden />
            ) : (
              <ChevronDown size={14} aria-hidden />
            )}
          </button>
          {showRefine && (
            <div className="space-y-3">
              <label className="block space-y-2 text-xs text-text-muted">
                What should change?
                <input
                  value={refinementText}
                  maxLength={1000}
                  disabled={disabled}
                  onChange={(event) => onRefinementChange(event.target.value)}
                  placeholder="Warmer light, a wider composition…"
                  className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-text"
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !disabled &&
                      refinementText.trim()
                    )
                      onRefine();
                  }}
                />
              </label>
              <Button
                variant="secondary"
                disabled={disabled || !refinementText.trim()}
                onClick={onRefine}
              >
                {isRefining ? (
                  <Loader2
                    size={14}
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden
                  />
                ) : (
                  <RefreshCw size={14} aria-hidden />
                )}
                Refine direction
              </Button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
