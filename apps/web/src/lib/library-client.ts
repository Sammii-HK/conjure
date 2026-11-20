import type { SavedPrompt, PromptVariation } from "../types/index.ts";
import {
  saveLocalPrompt,
  updateLocalPrompt,
  removeLocalPrompt,
  type PromptContext,
} from "./local-library.ts";
export async function libraryRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      data.error || "Your library change could not be saved. Try again.",
    );
  return data;
}
export async function saveVariation(input: {
  storage: "browser" | "account";
  iterationId: string;
  variation: PromptVariation;
  context: PromptContext;
}): Promise<SavedPrompt> {
  if (input.storage === "browser")
    return saveLocalPrompt(
      localStorage,
      input.iterationId,
      input.variation,
      input.context,
    );
  const value = await libraryRequest("/api/prompts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      iterationId: input.iterationId,
      label: input.variation.label,
      output: input.variation.prompt,
    }),
  });
  return { ...value, storage: "account" };
}
export async function rateSaved(prompt: SavedPrompt, rating: number | null) {
  if (prompt.storage === "browser")
    return updateLocalPrompt(localStorage, prompt.id, { rating });
  return {
    ...(await libraryRequest(
      `/api/prompts/${encodeURIComponent(prompt.id)}/rate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      },
    )),
    storage: "account",
  } as SavedPrompt;
}
export async function favouriteSaved(prompt: SavedPrompt) {
  if (prompt.storage === "browser")
    return updateLocalPrompt(localStorage, prompt.id, {
      favourite: !prompt.favourite,
    });
  return {
    ...(await libraryRequest(`/api/prompts/${encodeURIComponent(prompt.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favourite: !prompt.favourite }),
    })),
    storage: "account",
  } as SavedPrompt;
}
export async function removeSaved(prompt: SavedPrompt) {
  if (prompt.storage === "browser")
    return removeLocalPrompt(localStorage, prompt.id);
  await libraryRequest(`/api/prompts/${encodeURIComponent(prompt.id)}`, {
    method: "DELETE",
  });
}
