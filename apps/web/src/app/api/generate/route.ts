import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_STYLE_HINTS, PLATFORM_PARAMS } from "@/types";
import type { Platform, Orientation } from "@/types";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const generateSchema = z.object({
  brief: z.string().min(1).max(2000),
  account: z.string().optional(),
  platform: z.enum(["midjourney", "flux", "dalle"]).default("midjourney"),
  orientation: z.enum(["portrait", "square", "landscape"]).default("portrait"),
  sessionId: z.string().optional(),
  refinement: z.string().optional(),
  basePrompt: z.string().optional(),
});

function buildSystemPrompt(account: string | undefined, platform: string): string {
  const styleHint = account && ACCOUNT_STYLE_HINTS[account]
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
- End with technical params like --ar 9:16 --v 6.1 --stylize 750 (these will be appended by the system).`
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
Avoid abstract concepts — be concrete and visual.`;

  return `You are an expert image generation prompt engineer. Your job is to transform user briefs into high-quality image generation prompts.
${platformGuide}${styleHint}

You will generate EXACTLY 3 variations for each request:
1. "safe" — Conservative, highly polished interpretation. Will definitely work. Clean execution of the brief.
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

Do NOT include technical parameters like --ar or --v in the prompts — these will be appended automatically.`;
}

function appendParams(prompt: string, platform: Platform, orientation: Orientation): string {
  const params = PLATFORM_PARAMS[platform]?.[orientation];
  if (!params) return prompt;

  if (platform === "dalle") {
    // DALL·E uses size differently — don't append to prompt text
    return prompt;
  }

  return `${prompt} ${params}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { brief, account, platform, orientation, sessionId, refinement, basePrompt } =
      parsed.data;

    const isRefinement = !!(sessionId && refinement && basePrompt);

    const userPrompt = isRefinement
      ? `Original brief: "${brief}"

Base prompt to refine:
${basePrompt}

Refinement instruction: "${refinement}"

Generate 3 refined variations based on the original prompt, applying the refinement instruction. Keep what works, change what's asked.`
      : `Brief: "${brief}"

Generate 3 prompt variations for this brief.`;

    const systemPrompt = buildSystemPrompt(account, platform);

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 2000,
    });

    let parsed_response: { variations: Array<{ label: string; prompt: string }> };
    try {
      parsed_response = JSON.parse(text.trim());
    } catch {
      // Try to extract JSON if wrapped in markdown
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Invalid response format from AI");
      parsed_response = JSON.parse(match[0]);
    }

    // Append platform params
    const variations = parsed_response.variations.map((v) => ({
      ...v,
      prompt: appendParams(v.prompt, platform as Platform, orientation as Orientation),
    }));

    // Persist to DB (anonymous session for now — auth can be added later)
    let session;
    if (isRefinement && sessionId) {
      session = await prisma.promptSession.findUnique({ where: { id: sessionId } });
    }

    if (!session) {
      // Create anonymous session (no userId required for MVP)
      // We'll use a system user or skip DB save if no auth
      // For now, skip DB persistence without auth
      return NextResponse.json({
        sessionId: sessionId ?? `temp_${Date.now()}`,
        iterationId: `temp_${Date.now()}`,
        variations,
      });
    }

    const iteration = await prisma.promptIteration.create({
      data: {
        sessionId: session.id,
        refinement: refinement ?? null,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      iterationId: iteration.id,
      variations,
    });
  } catch (err) {
    console.error("[generate] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
