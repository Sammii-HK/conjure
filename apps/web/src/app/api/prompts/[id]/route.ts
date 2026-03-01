import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.prompt.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[prompt DELETE] error:", err);
    return NextResponse.json({ error: "Failed to delete prompt" }, { status: 500 });
  }
}
