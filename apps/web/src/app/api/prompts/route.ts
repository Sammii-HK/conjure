import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const saveSchema = z.object({
  iterationId: z.string(),
  label: z.string(),
  output: z.string(),
  tags: z.array(z.string()).optional(),
  collectionId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const account = searchParams.get("account");
    const ratingFilter = searchParams.get("rating");
    const favouritesOnly = searchParams.get("favourites") === "true";

    const where: Record<string, unknown> = { saved: true };

    if (account) {
      where.iteration = {
        session: { account },
      };
    }

    if (ratingFilter === "good") {
      where.rating = 1;
    } else if (ratingFilter === "bad") {
      where.rating = -1;
    }

    if (favouritesOnly) {
      where.favourite = true;
    }

    const prompts = await prisma.prompt.findMany({
      where,
      include: {
        iteration: {
          include: {
            session: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(prompts);
  } catch (err) {
    console.error("[prompts GET] error:", err);
    return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = saveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { iterationId, label, output, tags, collectionId } = parsed.data;

    // Verify iteration exists
    const iteration = await prisma.promptIteration.findUnique({
      where: { id: iterationId },
      include: { session: true },
    });

    if (!iteration) {
      return NextResponse.json({ error: "Iteration not found" }, { status: 404 });
    }

    const prompt = await prisma.prompt.create({
      data: {
        iterationId,
        userId: iteration.session.userId,
        label,
        output,
        saved: true,
        tags: tags ?? [],
        collectionId: collectionId ?? null,
      },
    });

    return NextResponse.json(prompt, { status: 201 });
  } catch (err) {
    console.error("[prompts POST] error:", err);
    return NextResponse.json({ error: "Failed to save prompt" }, { status: 500 });
  }
}
