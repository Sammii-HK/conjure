import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { generationHandler } from "@/lib/generation-handler";
import { accountUser } from "@/lib/account-library";
export const dynamic = "force-dynamic";
export const POST = generationHandler({
  available: () => !!process.env.GROQ_API_KEY,
  user: accountUser,
  ownedSession: async (userId, id) =>
    !!(await (
      await import("@/lib/prisma")
    ).prisma.promptSession.findFirst({
      where: { id, userId },
      select: { id: true },
    })),
  persist: async (userId, input, sessionId) => {
    const { prisma } = await import("@/lib/prisma");
    return prisma.$transaction(async (tx) => {
      const session = sessionId
        ? { id: sessionId }
        : await tx.promptSession.create({
            data: {
              userId,
              brief: input.brief,
              account: input.account || null,
              platform: input.platform,
              orientation: input.orientation,
            },
          });
      const iteration = await tx.promptIteration.create({
        data: { sessionId: session.id, refinement: input.refinement ?? null },
      });
      return { sessionId: session.id, iterationId: iteration.id };
    });
  },
  generate: async ({ system, prompt, signal }) => {
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
    return (
      await generateText({
        model: groq("llama-3.3-70b-versatile"),
        system,
        prompt,
        maxTokens: 2000,
        abortSignal: signal,
      })
    ).text;
  },
});
