import { trustedMessage, validPrompt } from "./config";
const PANEL_ID = "conjure-panel",
  TOGGLE_ID = "conjure-toggle";
function init() {
  if (document.getElementById(TOGGLE_ID)) return;
  const panel = document.createElement("iframe"),
    toggle = document.createElement("button");
  panel.id = PANEL_ID;
  panel.src = chrome.runtime.getURL("panel/index.html");
  panel.title = "Conjure prompt studio";
  const extensionOrigin = `chrome-extension://${chrome.runtime.id}`;
  panel.style.cssText =
    "position:fixed;right:0;top:0;width:min(420px,calc(100vw - 44px));height:100dvh;z-index:999998;border:0;border-left:1px solid #302740;box-shadow:-4px 0 24px #0006;background:#0a0a0f;";
  toggle.id = TOGGLE_ID;
  toggle.type = "button";
  toggle.textContent = "Conjure";
  toggle.setAttribute("aria-controls", PANEL_ID);
  toggle.style.cssText =
    "position:fixed;right:0;top:50%;z-index:999999;min-height:44px;min-width:44px;padding:12px 8px;background:#7c3aed;color:white;border:0;border-radius:8px 0 0 8px;font:600 12px system-ui;writing-mode:vertical-rl;cursor:pointer;";
  let open = false;
  function setOpen(value: boolean) {
    open = value;
    panel.hidden = !value;
    panel.inert = !value;
    toggle.setAttribute("aria-expanded", String(value));
    toggle.setAttribute(
      "aria-label",
      value ? "Close Conjure panel" : "Open Conjure panel",
    );
    toggle.style.right = value ? "min(420px,calc(100vw - 44px))" : "0";
  }
  document.body.append(panel, toggle);
  setOpen(false);
  toggle.addEventListener("click", () => {
    setOpen(!open);
    void chrome.storage.local.set({ conjurePanelOpen: open });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && open) {
      setOpen(false);
      toggle.focus();
    }
  });
  chrome.storage.local.get("conjurePanelOpen", (result) => {
    if (result.conjurePanelOpen === true) setOpen(true);
  });
  window.addEventListener("message", (event) => {
    if (!trustedMessage(event, panel.contentWindow, extensionOrigin)) return;
    if (event.data.type === "CONJURE_CLOSE") {
      setOpen(false);
      toggle.focus();
      return;
    }
    if (
      event.data.type !== "CONJURE_INJECT_PROMPT" ||
      !validPrompt(event.data.prompt)
    )
      return;
    const ok = injectPrompt(event.data.prompt);
    panel.contentWindow?.postMessage(
      { type: "CONJURE_INJECT_RESULT", ok },
      extensionOrigin,
    );
  });
}
function injectPrompt(prompt: string): boolean {
  const input = document.querySelector<HTMLElement>(
    'textarea[placeholder*="Imagine"], [contenteditable="true"][data-placeholder*="Imagine"], textarea[name="prompt"], [data-testid="prompt-input"]',
  );
  if (input instanceof HTMLTextAreaElement) {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, prompt);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  } else if (input?.isContentEditable) {
    input.textContent = prompt;
    input.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: prompt,
      }),
    );
  } else return false;
  input.focus();
  return true;
}
if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", init, { once: true });
else init();
