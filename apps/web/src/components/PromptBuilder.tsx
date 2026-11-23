"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PromptCard } from "@/components/PromptCard";
import type {
  Account,
  GenerateRequest,
  GenerateResponse,
  Orientation,
  Platform,
} from "@/types";
import type { PromptContext } from "@/lib/local-library";
const ACCOUNTS: [Account | "", string][] = [
  ["", "No style profile"],
  ["sammiisparkle", "Sammii Sparkle"],
  ["spellbound", "Spellbound"],
  ["lunary", "Lunary"],
  ["personal", "Personal"],
];
export function PromptBuilder({
  initialBrief = "",
  initialPrompt = "",
}: {
  initialBrief?: string;
  initialPrompt?: string;
}) {
  const [brief, setBrief] = useState(initialBrief),
    [account, setAccount] = useState<Account | "">(""),
    [platform, setPlatform] = useState<Platform>("midjourney"),
    [orientation, setOrientation] = useState<Orientation>("portrait");
  const [result, setResult] = useState<GenerateResponse | null>(null),
    [context, setContext] = useState<PromptContext | null>(null),
    [error, setError] = useState("");
  const [busy, setBusy] = useState(false),
    [refining, setRefining] = useState<number | null>(null),
    [instructions, setInstructions] = useState<Record<number, string>>({});
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  async function generate(index?: number) {
    if (request.current) return;
    const isRefine = index !== undefined;
    if (isRefine && (!result || !context || !instructions[index!]?.trim()))
      return;
    const nextContext: PromptContext = isRefine
      ? { ...context!, refinement: instructions[index!].trim() }
      : {
          brief: brief.trim(),
          account: account || null,
          platform,
          orientation,
          refinement: null,
        };
    if (!nextContext.brief) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setRefining(index ?? null);
    setError("");
    const body: GenerateRequest = {
      brief: nextContext.brief,
      account: (nextContext.account || "") as Account | "",
      platform: nextContext.platform as Platform,
      orientation: nextContext.orientation as Orientation,
      ...(isRefine
        ? {
            sessionId: result!.sessionId,
            basePrompt: result!.variations[index!].prompt,
            refinement: nextContext.refinement!,
          }
        : initialPrompt
          ? { basePrompt: initialPrompt }
          : {}),
    };
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          data.error || "Your request could not finish. Try again.",
        );
      if (
        !Array.isArray(data.variations) ||
        data.variations.length !== 3 ||
        !data.iterationId
      )
        throw new Error("The response was incomplete. Try again.");
      setResult({
        ...data,
        storage: data.storage === "account" ? "account" : "browser",
      });
      setContext(nextContext);
      setInstructions({});
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(
          cause instanceof Error
            ? cause.message
            : "Your request could not finish. Try again.",
        );
    } finally {
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
        setRefining(null);
      }
    }
  }
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)]">
      <section
        aria-labelledby="brief-heading"
        className="rounded-2xl border border-border bg-card p-5 sm:p-7 lg:sticky lg:top-6"
      >
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded-xl bg-accent/15 p-2.5 text-violet-300">
            <Wand2 size={20} aria-hidden />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-text-muted">
              Start with an idea
            </p>
            <h2 id="brief-heading" className="mt-1 text-lg font-semibold">
              Your image brief
            </h2>
          </div>
        </div>
        <label htmlFor="brief" className="mb-2 block text-sm text-text-muted">
          What do you want to make?
        </label>
        <textarea
          id="brief"
          maxLength={2000}
          value={brief}
          onChange={(event) => setBrief(event.target.value)}
          rows={7}
          placeholder="The subject, the atmosphere, a detail you don’t want to lose…"
          className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void generate();
            }
          }}
        />
        <div className="mt-2 flex justify-between gap-3 text-xs text-text-muted">
          <span>Be visual. What should someone see?</span>
          <span>{brief.length}/2000</span>
        </div>
        {initialPrompt && (
          <div className="mt-4 rounded-lg border border-violet-500/25 bg-accent/10 p-3 text-xs leading-relaxed text-violet-200">
            Remixing a saved prompt. Its text is used as a starting point.
          </div>
        )}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-xs text-text-muted">
            Image tool
            <select
              aria-label="Image tool"
              value={platform}
              onChange={(event) => setPlatform(event.target.value as Platform)}
              className="min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-text"
            >
              {[
                ["midjourney", "Midjourney"],
                ["flux", "FLUX"],
                ["dalle", "DALL·E"],
              ].map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-xs text-text-muted">
            Composition
            <select
              aria-label="Composition"
              value={orientation}
              onChange={(event) =>
                setOrientation(event.target.value as Orientation)
              }
              className="min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-text"
            >
              {[
                ["portrait", "Portrait / 9:16"],
                ["square", "Square / 1:1"],
                ["landscape", "Landscape / 16:9"],
              ].map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-xs text-text-muted sm:col-span-2">
            Style profile
            <select
              aria-label="Style profile"
              value={account}
              onChange={(event) =>
                setAccount(event.target.value as Account | "")
              }
              className="min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-text"
            >
              {ACCOUNTS.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-text-muted">
          {platform === "midjourney"
            ? "Adds your aspect ratio. Your Midjourney model and styling settings stay yours."
            : "Creates prompt text. Set matching image dimensions in your image tool."}
        </p>
        <Button
          className="mt-6 w-full"
          size="lg"
          disabled={busy || !brief.trim()}
          onClick={() => void generate()}
        >
          {busy ? (
            <Loader2
              size={18}
              className="animate-spin motion-reduce:animate-none"
              aria-hidden
            />
          ) : (
            <Sparkles size={18} aria-hidden />
          )}
          {busy
            ? refining !== null
              ? "Refining your direction…"
              : "Writing three directions…"
            : "Create three directions"}
        </Button>
        <p className="mt-3 text-center text-xs text-text-muted">
          Cmd or Ctrl + Enter
        </p>
      </section>
      <section aria-labelledby="results-heading" className="min-w-0 space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-text-muted">
              Explore the possibilities
            </p>
            <h2 id="results-heading" className="mt-2 text-xl font-semibold">
              Three directions. Your judgement.
            </h2>
          </div>
          <span className="text-xs text-text-muted">
            {result ? "Ready to review" : "Not generated yet"}
          </span>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-700/40 bg-red-950/30 p-4 text-sm text-red-200"
          >
            {error}
          </p>
        )}
        {result && context ? (
          <>
            <p className="text-xs leading-relaxed text-text-muted">
              {result.storage === "browser"
                ? "Save and rate the ones you like. They are kept in this browser."
                : "Save and rate the ones you like in your library."}{" "}
              Refining keeps your brief and settings.
            </p>
            {result.variations.map((variation, index) => (
              <PromptCard
                key={`${result.iterationId}:${variation.label}`}
                variation={variation}
                sessionId={result.sessionId}
                iterationId={result.iterationId}
                context={context}
                storage={result.storage}
                refinementText={instructions[index] ?? ""}
                isRefining={refining === index}
                disabled={busy}
                onRefinementChange={(text) =>
                  setInstructions((previous) => ({
                    ...previous,
                    [index]: text,
                  }))
                }
                onRefine={() => void generate(index)}
              />
            ))}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 sm:px-8">
            <p className="max-w-sm text-lg leading-relaxed text-text">
              A straightforward take, an artistic interpretation and a bolder
              departure.
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-text-muted">
              Write a brief to see the differences. Keep a direction, refine it
              or copy it into your image tool.
            </p>
            <a
              href="/library"
              className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm text-violet-300"
            >
              Visit your library <ArrowUpRight size={16} aria-hidden />
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
