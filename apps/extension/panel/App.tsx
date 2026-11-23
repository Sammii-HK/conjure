import { useEffect, useRef, useState } from "react";
import { Copy, RefreshCw, Send, X, Loader2 } from "lucide-react";
import { API_URL, HOST_ORIGIN, trustedMessage } from "../config";
type Variation = {
  label: "safe" | "creative" | "experimental";
  prompt: string;
};
type Context = {
  brief: string;
  account: string;
  platform: string;
  orientation: string;
};
const field: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  padding: 10,
  borderRadius: 8,
  border: "1px solid #443650",
  background: "#15101d",
  color: "#f1eaf8",
  font: "inherit",
};
const action: React.CSSProperties = {
  minHeight: 44,
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #443650",
  background: "#21172d",
  color: "#f1eaf8",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  cursor: "pointer",
  font: "inherit",
};
export default function App() {
  const [brief, setBrief] = useState(""),
    [account, setAccount] = useState(""),
    [platform, setPlatform] = useState("midjourney"),
    [orientation, setOrientation] = useState("portrait"),
    [busy, setBusy] = useState(false),
    [variations, setVariations] = useState<Variation[]>([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [sessionId, setSessionId] = useState<string | null>(null),
    [context, setContext] = useState<Context | null>(null),
    [refining, setRefining] = useState<number | null>(null),
    [refinement, setRefinement] = useState("");
  const pending = useRef<AbortController | null>(null);
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (
        !trustedMessage(event, window.parent, HOST_ORIGIN) ||
        event.data.type !== "CONJURE_INJECT_RESULT"
      )
        return;
      if (event.data.ok === true)
        setNotice(
          "Placed into Midjourney. Review it before generating an image.",
        );
      else
        setError(
          "Midjourney’s prompt field was not found. Copy the prompt and paste it manually.",
        );
    }
    window.addEventListener("message", receive);
    return () => {
      window.removeEventListener("message", receive);
      pending.current?.abort();
    };
  }, []);
  async function generate(index?: number) {
    if (pending.current) return;
    const isRefine = index !== undefined;
    const settings =
      isRefine && context
        ? context
        : { brief: brief.trim(), account, platform, orientation };
    if (!settings.brief || (isRefine && !refinement.trim())) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          ...settings,
          account: settings.account || undefined,
          ...(isRefine
            ? {
                sessionId,
                basePrompt: variations[index!].prompt,
                refinement: refinement.trim(),
              }
            : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw Error(
          data.error || "Prompt generation could not finish. Try again.",
        );
      if (
        !Array.isArray(data.variations) ||
        data.variations.length !== 3 ||
        new Set(data.variations.map((v: Variation) => v.label)).size !== 3 ||
        !data.variations.every(
          (v: Variation) =>
            ["safe", "creative", "experimental"].includes(v.label) &&
            typeof v.prompt === "string" &&
            v.prompt.trim(),
        )
      )
        throw Error(
          "The reply did not contain all three prompt directions. Try again.",
        );
      setVariations(data.variations);
      setContext(settings);
      setSessionId(data.sessionId);
      setRefining(null);
      setRefinement("");
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(
          cause instanceof Error
            ? cause.message
            : "The request could not finish.",
        );
    } finally {
      pending.current = null;
      setBusy(false);
    }
  }
  async function copy(prompt: string) {
    setError("");
    try {
      await navigator.clipboard.writeText(prompt);
      setNotice("Prompt copied.");
    } catch {
      setError(
        "Copy is unavailable. Select the prompt text and copy it manually.",
      );
    }
  }
  return (
    <main
      style={{
        padding: 20,
        minHeight: "100dvh",
        background: "#0d0912",
        color: "#f1eaf8",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24 }}>Conjure</h1>
          <p style={{ color: "#baaccb", marginTop: 4 }}>
            Three directions for your next image.
          </p>
        </div>
        <button
          type="button"
          style={action}
          aria-label="Close Conjure panel"
          onClick={() =>
            window.parent.postMessage({ type: "CONJURE_CLOSE" }, HOST_ORIGIN)
          }
        >
          <X size={18} aria-hidden />
        </button>
      </header>
      <label style={{ display: "block", marginBottom: 16 }}>
        Your image brief
        <textarea
          value={brief}
          disabled={busy}
          maxLength={2000}
          onChange={(event) => setBrief(event.target.value)}
          rows={4}
          placeholder="A moonlit garden, soft silver light…"
          style={{ ...field, marginTop: 8, resize: "vertical" }}
        />
      </label>
      <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
        {[
          {
            label: "Style profile",
            value: account,
            set: setAccount,
            options: [
              ["", "No profile"],
              ["sammiisparkle", "sammiisparkle"],
              ["spellbound", "spellbound"],
              ["lunary", "lunary"],
              ["personal", "personal"],
            ],
          },
          {
            label: "Image tool",
            value: platform,
            set: setPlatform,
            options: [
              ["midjourney", "Midjourney"],
              ["flux", "FLUX"],
              ["dalle", "DALL·E"],
            ],
          },
          {
            label: "Composition",
            value: orientation,
            set: setOrientation,
            options: [
              ["portrait", "Portrait 9:16"],
              ["square", "Square 1:1"],
              ["landscape", "Landscape 16:9"],
            ],
          },
        ].map((item) => (
          <label key={item.label}>
            {item.label}
            <select
              value={item.value}
              disabled={busy}
              onChange={(event) => item.set(event.target.value)}
              style={{ ...field, marginTop: 6 }}
            >
              {item.options.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <button
        type="button"
        disabled={busy || !brief.trim()}
        onClick={() => void generate()}
        style={{
          ...action,
          width: "100%",
          background: "#7c3aed",
          opacity: busy || !brief.trim() ? 0.5 : 1,
        }}
      >
        {busy ? (
          <Loader2 size={16} aria-hidden />
        ) : (
          <Send size={16} aria-hidden />
        )}
        {busy ? "Drafting directions…" : "Draft three directions"}
      </button>
      <p
        style={{
          color: "#baaccb",
          fontSize: 12,
          lineHeight: 1.6,
          margin: "12px 0 20px",
        }}
      >
        Writes prompt text for you to place or copy. Nothing is submitted to
        Midjourney until you press generate. Copy a prompt to keep it.
      </p>
      {error && (
        <p
          role="alert"
          style={{
            padding: 12,
            color: "#fca5a5",
            border: "1px solid #7f1d1d",
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {error}
        </p>
      )}
      <p
        role="status"
        style={{ fontSize: 12, color: "#c4b5fd", marginBottom: 12 }}
      >
        {notice}
      </p>
      {!variations.length && (
        <section
          style={{
            border: "1px dashed #443650",
            padding: 20,
            borderRadius: 12,
          }}
        >
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>Start with an idea.</h2>
          <p style={{ color: "#baaccb", lineHeight: 1.6 }}>
            Explore a straightforward interpretation, an artistic variation and
            a bolder departure.
          </p>
        </section>
      )}
      {variations.map((variation, index) => (
        <article
          key={`${sessionId}:${variation.label}:${variation.prompt}`}
          style={{
            padding: 16,
            background: "#17101f",
            border: "1px solid #443650",
            borderRadius: 12,
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 15, textTransform: "capitalize" }}>
            {variation.label === "safe" ? "Straightforward" : variation.label}
          </h2>
          <p
            style={{
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              lineHeight: 1.7,
              margin: "14px 0",
              fontSize: 13,
            }}
          >
            {variation.prompt}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              style={action}
              onClick={() => void copy(variation.prompt)}
            >
              <Copy size={15} aria-hidden />
              Copy
            </button>
            {context?.platform === "midjourney" && (
              <button
                type="button"
                style={action}
                onClick={() => {
                  setError("");
                  setNotice("Trying Midjourney’s prompt field…");
                  window.parent.postMessage(
                    { type: "CONJURE_INJECT_PROMPT", prompt: variation.prompt },
                    HOST_ORIGIN,
                  );
                }}
              >
                <Send size={15} aria-hidden />
                Place in Midjourney
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              aria-expanded={refining === index}
              style={action}
              onClick={() => {
                setRefining(refining === index ? null : index);
                setRefinement("");
              }}
            >
              <RefreshCw size={15} aria-hidden />
              Refine
            </button>
          </div>
          {refining === index && (
            <div style={{ marginTop: 12 }}>
              <label>
                What should change?
                <input
                  style={{ ...field, marginTop: 6 }}
                  disabled={busy}
                  value={refinement}
                  maxLength={1000}
                  onChange={(event) => setRefinement(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void generate(index);
                  }}
                  placeholder="Warmer light, wider composition…"
                />
              </label>
              <button
                type="button"
                disabled={busy || !refinement.trim()}
                style={{ ...action, marginTop: 8 }}
                onClick={() => void generate(index)}
              >
                Refine direction
              </button>
            </div>
          )}
        </article>
      ))}
      <a
        href={`${API_URL}/library`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#c4b5fd",
          display: "inline-flex",
          alignItems: "center",
          minHeight: 44,
        }}
      >
        Open the web studio and library
      </a>
      <p style={{ fontSize: 12, color: "#baaccb", lineHeight: 1.6 }}>
        Save prompts you want to keep in the web studio.
      </p>
    </main>
  );
}
