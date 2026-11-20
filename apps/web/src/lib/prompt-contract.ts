import { z } from "zod";
import { PLATFORM_PARAMS } from "../types/index.ts";
import type { Orientation, Platform, PromptVariation } from "../types/index.ts";

export const promptLabel = z.enum(["safe", "creative", "experimental"]);
export const generateSchema = z.object({
  brief: z.string().trim().min(1).max(2000),
  account: z
    .enum(["", "sammiisparkle", "spellbound", "lunary", "personal"])
    .optional(),
  platform: z.enum(["midjourney", "flux", "dalle"]).default("midjourney"),
  orientation: z.enum(["portrait", "square", "landscape"]).default("portrait"),
  sessionId: z.string().min(1).max(200).optional(),
  refinement: z.string().trim().min(1).max(1000).optional(),
  basePrompt: z.string().trim().min(1).max(8000).optional(),
});
export type GenerationInput = z.infer<typeof generateSchema>;

const modelOutput = z
  .object({
    variations: z
      .array(
        z.object({
          label: promptLabel,
          prompt: z.string().trim().min(1).max(8000),
        }),
      )
      .length(3),
  })
  .refine((value) => new Set(value.variations.map((v) => v.label)).size === 3);
export function parseVariations(text: string): PromptVariation[] {
  const fenced = text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const result = modelOutput.safeParse(JSON.parse(fenced?.[1] ?? text.trim()));
  if (!result.success)
    throw new Error(
      "The model did not return all three prompt directions. Try again.",
    );
  return ["safe", "creative", "experimental"].map(
    (label) => result.data.variations.find((item) => item.label === label)!,
  );
}
export function appendParams(
  prompt: string,
  platform: Platform,
  orientation: Orientation,
) {
  const params = PLATFORM_PARAMS[platform][orientation];
  return platform === "midjourney"
    ? `${prompt.replace(/\s*--(?:ar|aspect)\s+\d+(?:\.\d+)?:\d+(?:\.\d+)?/g, "").trim()} ${params}`
    : prompt;
}
export function generationUserPrompt(input: GenerationInput) {
  const composition = {
    portrait: "portrait, 9:16",
    square: "square, 1:1",
    landscape: "landscape, 16:9",
  }[input.orientation];
  return `Brief: ${input.brief}\nComposition: ${composition}.${input.basePrompt ? `\nReference prompt: ${input.basePrompt}` : ""}${input.refinement ? `\nRefinement: ${input.refinement}` : ""}\nReturn three prompt directions. Image dimensions must be selected in the image tool; this request generates prompt text only.`;
}
