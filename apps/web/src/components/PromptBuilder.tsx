"use client";

import { useState } from "react";
import { Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PromptCard } from "@/components/PromptCard";
import type {
  Account,
  GenerateRequest,
  Orientation,
  Platform,
  PromptVariation,
} from "@/types";

const ACCOUNTS: { value: Account | ""; label: string }[] = [
  { value: "", label: "No account" },
  { value: "sammiisparkle", label: "sammiisparkle" },
  { value: "spellbound", label: "spellbound" },
  { value: "lunary", label: "lunary" },
  { value: "personal", label: "personal" },
];

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "midjourney", label: "Midjourney" },
  { value: "flux", label: "FLUX" },
  { value: "dalle", label: "DALL·E" },
];

const ORIENTATIONS: { value: Orientation; label: string }[] = [
  { value: "portrait", label: "Portrait 9:16" },
  { value: "square", label: "Square 1:1" },
  { value: "landscape", label: "Landscape 16:9" },
];

interface PromptBuilderProps {
  initialBrief?: string;
  initialPrompt?: string;
}

export function PromptBuilder({ initialBrief = "", initialPrompt = "" }: PromptBuilderProps) {
  const [brief, setBrief] = useState(initialBrief);
  const [account, setAccount] = useState<Account | "">("");
  const [platform, setPlatform] = useState<Platform>("midjourney");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState<PromptVariation[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [iterationId, setIterationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refinement state per card
  const [refining, setRefining] = useState<Record<number, boolean>>({});
  const [refinementText, setRefinementText] = useState<Record<number, string>>({});

  async function handleGenerate() {
    if (!brief.trim()) return;
    setLoading(true);
    setError(null);

    const body: GenerateRequest = {
      brief,
      account,
      platform,
      orientation,
      ...(initialPrompt ? { basePrompt: initialPrompt } : {}),
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Generation failed");
      }

      const data = await res.json();
      setVariations(data.variations);
      setSessionId(data.sessionId);
      setIterationId(data.iterationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefine(index: number, basePrompt: string) {
    const refinement = refinementText[index];
    if (!refinement?.trim() || !sessionId) return;

    setRefining((prev) => ({ ...prev, [index]: true }));

    const body: GenerateRequest = {
      brief,
      account,
      platform,
      orientation,
      sessionId,
      refinement,
      basePrompt,
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Refinement failed");

      const data = await res.json();
      setVariations(data.variations);
      setIterationId(data.iterationId);
      setRefinementText((prev) => ({ ...prev, [index]: "" }));
      setRefining((prev) => ({ ...prev, [index]: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setRefining((prev) => ({ ...prev, [index]: false }));
    }
  }

  return (
    <div className="space-y-6">
      {/* Builder form */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">
            What do you want to create?
          </label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="A mystical forest at dusk with glowing mushrooms and fireflies, seen through the eyes of a wandering fox..."
            rows={4}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text placeholder:text-text-muted/50 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 resize-none transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
            }}
          />
          {initialPrompt && (
            <p className="mt-1.5 text-xs text-text-muted">
              Remixing saved prompt as base
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">
              Account
            </label>
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value as Account | "")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus:border-accent/50 focus:outline-none transition-colors"
            >
              {ACCOUNTS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus:border-accent/50 focus:outline-none transition-colors"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">
              Orientation
            </label>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as Orientation)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus:border-accent/50 focus:outline-none transition-colors"
            >
              {ORIENTATIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || !brief.trim()}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Conjuring...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Conjure
            </>
          )}
        </Button>

        <p className="text-center text-xs text-text-muted/50">
          Press Cmd+Enter to generate
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-800/50 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {variations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider">
            Generated variations
          </h2>
          <div className="grid gap-4">
            {variations.map((v, i) => (
              <PromptCard
                key={`${iterationId}-${i}`}
                variation={v}
                sessionId={sessionId}
                iterationId={iterationId}
                refinementText={refinementText[i] ?? ""}
                isRefining={refining[i] ?? false}
                onRefinementChange={(text) =>
                  setRefinementText((prev) => ({ ...prev, [i]: text }))
                }
                onRefine={() => handleRefine(i, v.prompt)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
