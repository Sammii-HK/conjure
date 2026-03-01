import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const rateSchema = z.object({
  rating: z.number().nullable(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = rateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    const prompt = await prisma.prompt.update({
      where: { id },
      data: { rating: parsed.data.rating },
    });

    return NextResponse.json(prompt);
  } catch (err) {
    console.error("[rate] error:", err);
    return NextResponse.json({ error: "Failed to rate prompt" }, { status: 500 });
  }
}
