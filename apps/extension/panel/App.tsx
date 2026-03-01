import { useState } from "react";

type Platform = "midjourney" | "flux" | "dalle";
type Orientation = "portrait" | "square" | "landscape";
type Account = "sammiisparkle" | "spellbound" | "lunary" | "personal" | "";

interface Variation {
  label: string;
  prompt: string;
}

const API_URL = "http://localhost:3000";

const ACCOUNT_OPTIONS: { value: Account; label: string }[] = [
  { value: "", label: "No account" },
  { value: "sammiisparkle", label: "sammiisparkle" },
  { value: "spellbound", label: "spellbound" },
  { value: "lunary", label: "lunary" },
  { value: "personal", label: "personal" },
];

const LABEL_COLORS: Record<string, string> = {
  safe: "#10b981",
  creative: "#7c3aed",
  experimental: "#f59e0b",
};

export default function App() {
  const [brief, setBrief] = useState("");
  const [account, setAccount] = useState<Account>("");
  const [platform, setPlatform] = useState<Platform>("midjourney");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [refining, setRefining] = useState<number | null>(null);
  const [refinementText, setRefinementText] = useState("");

  async function generate(refinement?: string, basePrompt?: string) {
    if (!brief.trim()) return;
    const isRefine = !!(refinement && basePrompt && sessionId);

    if (isRefine) {
      setRefining(null);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief,
          account: account || undefined,
          platform,
          orientation,
          ...(isRefine ? { sessionId, refinement, basePrompt } : {}),
        }),
      });

      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setVariations(data.variations);
      setSessionId(data.sessionId);
      setRefinementText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function injectPrompt(prompt: string) {
    // Post to parent frame (content script)
    window.parent.postMessage({ type: "CONJURE_INJECT_PROMPT", prompt }, "*");
  }

  async function copyPrompt(prompt: string, index: number) {
    await navigator.clipboard.writeText(prompt);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div style={{ padding: "12px", height: "100vh", overflowY: "auto", background: "#0a0a0f" }}>
      <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ color: "#7c3aed", fontWeight: 700, fontSize: "14px" }}>Conjure</span>
        <span style={{ color: "#94a3b8", fontSize: "11px" }}>AI Prompt Builder</span>
      </div>

      {/* Brief */}
      <textarea
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        placeholder="Describe what you want to create..."
        rows={4}
        style={{
          width: "100%",
          borderRadius: "8px",
          border: "1px solid #1e1e2e",
          background: "#12121a",
          color: "#e2e8f0",
          padding: "10px",
          fontSize: "12px",
          resize: "vertical",
          outline: "none",
          marginBottom: "8px",
          fontFamily: "inherit",
        }}
      />

      {/* Options row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "10px" }}>
        {([
          { label: "Account", value: account, onChange: (v: string) => setAccount(v as Account), options: ACCOUNT_OPTIONS },
          {
            label: "Platform",
            value: platform,
            onChange: (v: string) => setPlatform(v as Platform),
            options: [
              { value: "midjourney", label: "MJ" },
              { value: "flux", label: "FLUX" },
              { value: "dalle", label: "DALL·E" },
            ],
          },
          {
            label: "Format",
            value: orientation,
            onChange: (v: string) => setOrientation(v as Orientation),
            options: [
              { value: "portrait", label: "9:16" },
              { value: "square", label: "1:1" },
              { value: "landscape", label: "16:9" },
            ],
          },
        ] as const).map((field) => (
          <div key={field.label}>
            <div style={{ fontSize: "9px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "3px" }}>
              {field.label}
            </div>
            <select
              value={field.value}
              onChange={(e) => (field.onChange as (v: string) => void)(e.target.value)}
              style={{
                width: "100%",
                background: "#12121a",
                border: "1px solid #1e1e2e",
                borderRadius: "6px",
                color: "#e2e8f0",
                padding: "4px 6px",
                fontSize: "11px",
                outline: "none",
              }}
            >
              {field.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Generate button */}
      <button
        onClick={() => generate()}
        disabled={loading || !brief.trim()}
        style={{
          width: "100%",
          background: loading ? "#4c1d95" : "#7c3aed",
          color: "white",
          border: "none",
          borderRadius: "8px",
          padding: "10px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: "12px",
          opacity: !brief.trim() ? 0.5 : 1,
        }}
      >
        {loading ? "Conjuring..." : "Conjure"}
      </button>

      {error && (
        <div style={{ color: "#f87171", fontSize: "12px", marginBottom: "10px", padding: "8px", background: "#450a0a", borderRadius: "6px" }}>
          {error}
        </div>
      )}

      {/* Variations */}
      {variations.map((v, i) => (
        <div
          key={i}
          style={{
            background: "#12121a",
            border: "1px solid #1e1e2e",
            borderRadius: "10px",
            padding: "12px",
            marginBottom: "10px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: LABEL_COLORS[v.label] ?? "#94a3b8",
              }}
            >
              {v.label}
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => copyPrompt(v.prompt, i)}
                style={smallBtn("#1e1e2e")}
                title="Copy"
              >
                {copied === i ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() => injectPrompt(v.prompt)}
                style={smallBtn("#3b0764")}
                title="Inject into Midjourney"
              >
                Inject
              </button>
            </div>
          </div>

          <p style={{ fontSize: "11px", color: "#e2e8f0", lineHeight: 1.5, fontFamily: "monospace", wordBreak: "break-word" }}>
            {v.prompt}
          </p>

          {/* Refine */}
          {sessionId && (
            <div style={{ marginTop: "8px", borderTop: "1px solid #1e1e2e", paddingTop: "8px" }}>
              {refining === i ? (
                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    type="text"
                    value={refinementText}
                    onChange={(e) => setRefinementText(e.target.value)}
                    placeholder="more dreamy, warmer..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") generate(refinementText, v.prompt);
                    }}
                    style={{
                      flex: 1,
                      background: "#0a0a0f",
                      border: "1px solid #1e1e2e",
                      borderRadius: "6px",
                      color: "#e2e8f0",
                      padding: "4px 8px",
                      fontSize: "11px",
                      outline: "none",
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => generate(refinementText, v.prompt)}
                    style={smallBtn("#7c3aed")}
                  >
                    Go
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setRefining(i)}
                  style={{ fontSize: "11px", color: "#94a3b8", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  + Refine this prompt
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function smallBtn(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: "#e2e8f0",
    border: "none",
    borderRadius: "5px",
    padding: "3px 8px",
    fontSize: "10px",
    cursor: "pointer",
    fontWeight: 500,
  };
}
