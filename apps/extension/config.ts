export const API_URL = "https://conjure-two.vercel.app";
export const HOST_ORIGIN = "https://www.midjourney.com";
export function trustedMessage(
  event: Pick<MessageEvent, "source" | "origin" | "data">,
  source: MessageEventSource | null,
  origin: string,
): boolean {
  return (
    source !== null &&
    event.source === source &&
    event.origin === origin &&
    typeof event.data === "object" &&
    event.data !== null
  );
}
export function validPrompt(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= 10000
  );
}
