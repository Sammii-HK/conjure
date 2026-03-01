import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const prompt = await prisma.prompt.update({
      where: { id },
      data: { saved: true },
    });

    return NextResponse.json(prompt);
  } catch (err) {
    console.error("[save] error:", err);
    return NextResponse.json({ error: "Failed to save prompt" }, { status: 500 });
  }
}
