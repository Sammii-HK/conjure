import { libraryHandlers } from "@/lib/account-library";
export const dynamic = "force-dynamic";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return libraryHandlers.change(request, (await params).id, "saved");
}
