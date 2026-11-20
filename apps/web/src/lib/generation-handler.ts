import { ACCOUNT_STYLE_HINTS } from "../types/index.ts";
import {
  appendParams,
  generateSchema,
  generationUserPrompt,
  parseVariations,
  type GenerationInput,
} from "./prompt-contract.ts";

export function buildSystemPrompt(
  account: string | undefined,
  platform: string,
): string {
  const styleHint =
    account && ACCOUNT_STYLE_HINTS[account]
      ? `\n\nAccount style context for "${account}": ${ACCOUNT_STYLE_HINTS[account]}`
      : "";

  const platformGuide =
    platform === "midjourney"
      ? `
Midjourney prompt formula:
[subject] [action/pose] [setting/environment], [mood/atmosphere], [lighting], [style/medium], [artist references if relevant], [technical parameters]

Midjourney tips:
- Be specific and visual. Describe what you SEE, not what you feel.
- Use commas to separate descriptors, not full sentences.
- Lighting descriptors: golden hour, volumetric light, rim lighting, soft diffused, dramatic side-lighting, neon glow.
- Style anchors: cinematic, editorial, hyperrealistic, painterly, graphic novel, concept art, film still.
- End with technical params like --ar 9:16 (these will be appended by the system).`
      : platform === "flux"
        ? `
FLUX prompt formula:
Natural language description works well. Be detailed and descriptive.
Focus on: composition, lighting, mood, style, color palette, subject details.
Avoid Midjourney-specific syntax (no -- parameters in the prompt text).`
        : `
DALL·E prompt formula:
Clear, descriptive natural language.
Be explicit about style (photorealistic, illustration, painting, etc).
Describe lighting, composition, color palette.
Avoid abstract concepts. Be concrete and visual.`;

  return `You are an expert image generation prompt engineer. Your job is to transform user briefs into high-quality image generation prompts.
${platformGuide}${styleHint}

You will generate EXACTLY 3 variations for each request:
1. "safe" — Conservative, highly polished interpretation. A straightforward interpretation of the brief. It is not a guarantee of image quality.
2. "creative" — Interesting artistic interpretation. Adds unexpected but complementary elements. More expressive.
3. "experimental" — Bold, unconventional approach. Pushes the concept further. Might be surprising.

Return ONLY a JSON object in this exact format (no markdown, no extra text):
{
  "variations": [
    { "label": "safe", "prompt": "..." },
    { "label": "creative", "prompt": "..." },
    { "label": "experimental", "prompt": "..." }
  ]
}

Do NOT include technical parameters like --ar or --v in the prompts. Only the selected Midjourney aspect ratio will be appended automatically.`;
}

interface GenerationDependencies {
  available: () => boolean;
  user: (request: Request) => Promise<string | null>;
  ownedSession: (userId: string, id: string) => Promise<boolean>;
  persist: (
    userId: string,
    input: GenerationInput,
    sessionId?: string,
  ) => Promise<{ sessionId: string; iterationId: string }>;
  generate: (input: {
    system: string;
    prompt: string;
    signal: AbortSignal;
  }) => Promise<string>;
}
export function generationHandler(deps: GenerationDependencies) {
  return async (request: Request) => {
    const input = generateSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!input.success)
      return Response.json(
        { error: "Describe a brief and choose valid prompt settings." },
        { status: 400 },
      );
    if (!deps.available())
      return Response.json(
        {
          error:
            "Prompt generation is unavailable here. Your saved prompts are still accessible.",
        },
        { status: 503 },
      );
    try {
      const userId = await deps.user(request),
        data = input.data;
      const accountSession =
        userId && data.sessionId && !data.sessionId.startsWith("guest_")
          ? data.sessionId
          : undefined;
      if (accountSession && !(await deps.ownedSession(userId!, accountSession)))
        return Response.json(
          { error: "That generation session was not found." },
          { status: 404 },
        );
      const text = await deps.generate({
        system: buildSystemPrompt(data.account, data.platform),
        prompt: generationUserPrompt(data),
        signal: request.signal,
      });
      let variations;
      try {
        variations = parseVariations(text).map((value) => ({
          ...value,
          prompt: appendParams(value.prompt, data.platform, data.orientation),
        }));
      } catch {
        return Response.json(
          {
            error:
              "The model did not return all three prompt directions. Try again.",
          },
          { status: 502 },
        );
      }
      if (userId)
        return Response.json({
          ...(await deps.persist(userId, data, accountSession)),
          storage: "account",
          variations,
        });
      return Response.json({
        sessionId: data.sessionId?.startsWith("guest_")
          ? data.sessionId
          : `guest_${crypto.randomUUID()}`,
        iterationId: `guest_${crypto.randomUUID()}`,
        storage: "browser",
        variations,
      });
    } catch (error) {
      console.error(
        "[generate] request failed",
        error instanceof Error ? error.name : "UnknownError",
      );
      return Response.json(
        {
          error:
            "The request could not finish. Your previous prompts are still available. Try again.",
        },
        { status: 500 },
      );
    }
  };
}
