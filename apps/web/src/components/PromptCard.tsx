"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { PromptLabel, PromptVariation } from "@/types";

interface PromptCardProps {
  variation: PromptVariation;
  sessionId: string | null;
  iterationId: string | null;
  refinementText: string;
  isRefining: boolean;
  onRefinementChange: (text: string) => void;
  onRefine: () => void;
  savedId?: string;
  initialRating?: number | null;
}

const LABEL_VARIANT: Record<PromptLabel, "safe" | "creative" | "experimental"> = {
  safe: "safe",
  creative: "creative",
  experimental: "experimental",
};

export function PromptCard({
  variation,
  sessionId,
  iterationId,
  refinementText,
  isRefining,
  onRefinementChange,
  onRefine,
  savedId: initialSavedId,
  initialRating,
}: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | undefined>(initialSavedId);
  const [showRefine, setShowRefine] = useState(false);
  const [rating, setRating] = useState<number | null>(initialRating ?? null);
  const [ratingLoading, setRatingLoading] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(variation.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSave() {
    if (savedId || !iterationId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iterationId,
          label: variation.label,
          output: variation.prompt,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedId(data.id);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRate(value: number) {
    const newRating = rating === value ? null : value;
    setRatingLoading(true);

    const targetId = savedId;
    if (!targetId) {
      // Auto-save first, then rate
      try {
        if (iterationId) {
          const res = await fetch("/api/prompts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              iterationId,
              label: variation.label,
              output: variation.prompt,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setSavedId(data.id);
            await ratePrompt(data.id, newRating);
          }
        }
      } finally {
        setRatingLoading(false);
      }
      return;
    }

    await ratePrompt(targetId, newRating);
    setRatingLoading(false);
  }

  async function ratePrompt(id: string, value: number | null) {
    const res = await fetch(`/api/prompts/${id}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: value }),
    });
    if (res.ok) setRating(value);
  }

  return (
    <div className="group rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <Badge variant={LABEL_VARIANT[variation.label as PromptLabel] ?? "default"}>
          {variation.label}
        </Badge>
        <div className="flex items-center gap-1">
          {/* Rating */}
          <button
            onClick={() => handleRate(1)}
            disabled={ratingLoading}
            className={`p-1.5 rounded-lg transition-colors ${
              rating === 1
                ? "text-emerald-400 bg-emerald-900/30"
                : "text-text-muted hover:text-emerald-400 hover:bg-emerald-900/20"
            }`}
            title="Good prompt"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleRate(-1)}
            disabled={ratingLoading}
            className={`p-1.5 rounded-lg transition-colors ${
              rating === -1
                ? "text-red-400 bg-red-900/30"
                : "text-text-muted hover:text-red-400 hover:bg-red-900/20"
            }`}
            title="Not great"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || !!savedId}
            className={`p-1.5 rounded-lg transition-colors ${
              savedId
                ? "text-accent"
                : "text-text-muted hover:text-accent hover:bg-accent/10"
            }`}
            title={savedId ? "Saved to library" : "Save to library"}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : savedId ? (
              <BookmarkCheck className="h-3.5 w-3.5" />
            ) : (
              <Bookmark className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className={`p-1.5 rounded-lg transition-colors ${
              copied
                ? "text-emerald-400 bg-emerald-900/30"
                : "text-text-muted hover:text-text hover:bg-border"
            }`}
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      <p className="text-sm text-text leading-relaxed font-mono whitespace-pre-wrap break-words">
        {variation.prompt}
      </p>

      {/* Refine toggle */}
      {sessionId && (
        <div className="mt-3 border-t border-border/50 pt-3">
          <button
            onClick={() => setShowRefine(!showRefine)}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Refine this prompt
            {showRefine ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          {showRefine && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={refinementText}
                onChange={(e) => onRefinementChange(e.target.value)}
                placeholder="more dreamy, warmer tones, from behind..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-text placeholder:text-text-muted/50 focus:border-accent/50 focus:outline-none transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter") onRefine();
                }}
              />
              <Button
                onClick={onRefine}
                disabled={isRefining || !refinementText.trim()}
                size="sm"
                variant="secondary"
              >
                {isRefining ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Refine"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
