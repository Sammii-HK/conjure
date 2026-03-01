// Content script — injected into midjourney.com
// Injects a collapsible Conjure side panel

const PANEL_ID = "conjure-panel";
const TOGGLE_ID = "conjure-toggle";

function createToggleButton(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.id = TOGGLE_ID;
  btn.setAttribute("aria-label", "Toggle Conjure panel");
  btn.style.cssText = `
    position: fixed;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 999999;
    background: #7c3aed;
    color: white;
    border: none;
    border-radius: 8px 0 0 8px;
    padding: 12px 8px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    line-height: 1;
    box-shadow: -2px 0 12px rgba(124, 58, 237, 0.4);
    transition: background 150ms ease;
  `;
  btn.textContent = "CONJURE";

  btn.addEventListener("mouseenter", () => {
    btn.style.background = "#6d28d9";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.background = "#7c3aed";
  });

  return btn;
}

function createPanel(): HTMLIFrameElement {
  const iframe = document.createElement("iframe");
  iframe.id = PANEL_ID;

  // Panel URL — loads the web app in the iframe
  const apiUrl = "http://localhost:3000";
  iframe.src = apiUrl;

  iframe.style.cssText = `
    position: fixed;
    right: 0;
    top: 0;
    width: 420px;
    height: 100vh;
    z-index: 999998;
    border: none;
    border-left: 1px solid #1e1e2e;
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.5);
    background: #0a0a0f;
    transform: translateX(100%);
    transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
  `;

  return iframe;
}

let panelOpen = false;

function init() {
  // Don't inject twice
  if (document.getElementById(TOGGLE_ID)) return;

  const toggle = createToggleButton();
  const panel = createPanel();

  document.body.appendChild(panel);
  document.body.appendChild(toggle);

  toggle.addEventListener("click", () => {
    panelOpen = !panelOpen;
    panel.style.transform = panelOpen ? "translateX(0)" : "translateX(100%)";
    toggle.style.right = panelOpen ? "420px" : "0";
    chrome.storage.local.set({ conjurePanelOpen: panelOpen });
  });

  // Restore open state
  chrome.storage.local.get("conjurePanelOpen", (result) => {
    if (result.conjurePanelOpen) {
      panelOpen = true;
      panel.style.transform = "translateX(0)";
      toggle.style.right = "420px";
    }
  });

  // Listen for prompt injection messages from the panel
  window.addEventListener("message", (event) => {
    if (event.data?.type === "CONJURE_INJECT_PROMPT") {
      injectPromptIntoMidjourney(event.data.prompt);
    }
  });
}

function injectPromptIntoMidjourney(prompt: string) {
  // Midjourney uses a contenteditable div or textarea for prompts
  const selectors = [
    'textarea[placeholder*="Imagine"]',
    '[contenteditable][data-placeholder*="Imagine"]',
    'textarea[name="prompt"]',
    '[data-testid="prompt-input"]',
    '.prompt-input',
  ];

  let input: HTMLElement | null = null;
  for (const selector of selectors) {
    input = document.querySelector(selector);
    if (input) break;
  }

  if (!input) {
    console.warn("[Conjure] Could not find Midjourney prompt input");
    return;
  }

  if (input instanceof HTMLTextAreaElement) {
    input.value = prompt;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  } else if (input.isContentEditable) {
    input.textContent = prompt;
    input.dispatchEvent(new InputEvent("input", { bubbles: true, data: prompt }));
  }

  input.focus();
}

// Run on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
