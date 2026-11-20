import { libraryHandlers } from "@/lib/account-library";
export const dynamic = "force-dynamic";
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return libraryHandlers.remove(request, (await params).id);
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return libraryHandlers.change(request, (await params).id, "favourite");
}
