import { z } from "zod";
import { promptLabel } from "./prompt-contract.ts";
import type { SavedPrompt, PromptVariation } from "../types/index.ts";
export const LIBRARY_KEY = "conjure-library-v1";
export interface LibraryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export interface PromptContext {
  brief: string;
  account: string | null;
  platform: string;
  orientation: string;
  refinement?: string | null;
}
const recordSchema = z.object({
  storage: z.literal("browser"),
  id: z.string(),
  label: promptLabel,
  output: z.string(),
  rating: z.union([z.literal(-1), z.literal(1), z.null()]),
  favourite: z.boolean(),
  saved: z.boolean(),
  tags: z.array(z.string()),
  collectionId: z.string().nullable(),
  createdAt: z.string(),
  iteration: z.object({
    refinement: z.string().nullable(),
    session: z.object({
      brief: z.string(),
      account: z.string().nullable(),
      platform: z.string(),
      orientation: z.string(),
    }),
  }),
});
export function readLocalPrompts(storage: LibraryStorage): SavedPrompt[] {
  try {
    const raw = storage.getItem(LIBRARY_KEY);
    return raw ? z.array(recordSchema).parse(JSON.parse(raw)) : [];
  } catch {
    throw new Error(
      "This browser’s saved prompts could not be read. They have not been overwritten.",
    );
  }
}
function write(storage: LibraryStorage, prompts: SavedPrompt[]) {
  try {
    storage.setItem(LIBRARY_KEY, JSON.stringify(prompts));
  } catch {
    throw new Error(
      "This browser could not save your changes. Copy the prompt to keep it elsewhere.",
    );
  }
}
export function saveLocalPrompt(
  storage: LibraryStorage,
  iterationId: string,
  variation: PromptVariation,
  context: PromptContext,
): SavedPrompt {
  const prompts = readLocalPrompts(storage);
  const id = `local:${iterationId}:${variation.label}`;
  const existing = prompts.find((item) => item.id === id);
  if (existing) return existing;
  const prompt: SavedPrompt = {
    storage: "browser",
    id,
    label: variation.label,
    output: variation.prompt,
    rating: null,
    favourite: false,
    saved: true,
    tags: [],
    collectionId: null,
    createdAt: new Date().toISOString(),
    iteration: {
      refinement: context.refinement ?? null,
      session: {
        brief: context.brief,
        account: context.account,
        platform: context.platform,
        orientation: context.orientation,
      },
    },
  };
  write(storage, [prompt, ...prompts]);
  return prompt;
}
export function updateLocalPrompt(
  storage: LibraryStorage,
  id: string,
  patch: Pick<Partial<SavedPrompt>, "rating" | "favourite">,
) {
  const prompts = readLocalPrompts(storage);
  const target = prompts.find((item) => item.id === id);
  if (!target)
    throw new Error("This prompt is no longer in this browser’s library.");
  const updated = { ...target, ...patch };
  write(
    storage,
    prompts.map((item) => (item.id === id ? updated : item)),
  );
  return updated;
}
export function removeLocalPrompt(storage: LibraryStorage, id: string) {
  write(
    storage,
    readLocalPrompts(storage).filter((item) => item.id !== id),
  );
}
