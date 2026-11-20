import { z } from "zod";
import { promptLabel } from "./prompt-contract.ts";
export type SavedInput = {
  iterationId: string;
  userId: string;
  label: string;
  output: string;
  saved: boolean;
  tags: string[];
  collectionId: string | null;
};
export interface PromptStore {
  list(
    userId: string,
    filters: { account?: string; rating?: number; favourites: boolean },
  ): Promise<unknown[]>;
  iterationOwner(userId: string, id: string): Promise<boolean>;
  collectionOwner(userId: string, id: string): Promise<boolean>;
  create(input: SavedInput): Promise<unknown>;
  change(
    userId: string,
    id: string,
    patch: { rating?: number | null; favourite?: boolean; saved?: boolean },
  ): Promise<unknown | null>;
  remove(userId: string, id: string): Promise<boolean>;
}
export const saveSchema = z.object({
  iterationId: z.string().min(1).max(200),
  label: promptLabel,
  output: z.string().trim().min(1).max(8500),
  tags: z.array(z.string().max(80)).max(30).optional(),
  collectionId: z.string().min(1).max(200).optional(),
});
const ratingSchema = z.object({
  rating: z.union([z.literal(-1), z.literal(1), z.null()]),
});
export function promptHandlers(deps: {
  user: (request: Request) => Promise<string | null>;
  store: PromptStore;
}) {
  const failure = () =>
    Response.json(
      { error: "The library request could not be completed. Try again." },
      { status: 500 },
    );
  const unauthorised = () =>
    Response.json(
      {
        error:
          "Sign in to use the account library. Browser saves stay on this device.",
      },
      { status: 401 },
    );
  return {
    async list(request: Request) {
      try {
        const userId = await deps.user(request);
        if (!userId) return unauthorised();
        const params = new URL(request.url).searchParams;
        const rating = params.get("rating");
        return Response.json(
          await deps.store.list(userId, {
            account: params.get("account") || undefined,
            rating: rating === "good" ? 1 : rating === "bad" ? -1 : undefined,
            favourites: params.get("favourites") === "true",
          }),
        );
      } catch {
        return failure();
      }
    },
    async save(request: Request) {
      try {
        const userId = await deps.user(request);
        if (!userId) return unauthorised();
        const input = saveSchema.safeParse(
          await request.json().catch(() => null),
        );
        if (!input.success)
          return Response.json(
            { error: "The prompt is incomplete." },
            { status: 400 },
          );
        const data = input.data;
        if (!(await deps.store.iterationOwner(userId, data.iterationId)))
          return Response.json(
            {
              error:
                "Saved generation not found. Browser drafts must be saved on this device.",
            },
            { status: 404 },
          );
        if (
          data.collectionId &&
          !(await deps.store.collectionOwner(userId, data.collectionId))
        )
          return Response.json(
            { error: "Collection not found." },
            { status: 404 },
          );
        return Response.json(
          await deps.store.create({
            ...data,
            userId,
            saved: true,
            tags: data.tags ?? [],
            collectionId: data.collectionId ?? null,
          }),
          { status: 201 },
        );
      } catch {
        return failure();
      }
    },
    async change(
      request: Request,
      id: string,
      kind: "rating" | "favourite" | "saved",
    ) {
      try {
        const userId = await deps.user(request);
        if (!userId) return unauthorised();
        let patch: {
          rating?: number | null;
          favourite?: boolean;
          saved?: boolean;
        };
        if (kind === "saved") patch = { saved: true };
        else {
          const schema =
            kind === "rating"
              ? ratingSchema
              : z.object({ favourite: z.boolean() });
          const parsed = schema.safeParse(
            await request.json().catch(() => null),
          );
          if (!parsed.success)
            return Response.json(
              { error: "Invalid library change." },
              { status: 400 },
            );
          patch = parsed.data;
        }
        const result = await deps.store.change(userId, id, patch);
        return result
          ? Response.json(result)
          : Response.json({ error: "Prompt not found." }, { status: 404 });
      } catch {
        return failure();
      }
    },
    async remove(request: Request, id: string) {
      try {
        const userId = await deps.user(request);
        if (!userId) return unauthorised();
        return (await deps.store.remove(userId, id))
          ? Response.json({ success: true })
          : Response.json({ error: "Prompt not found." }, { status: 404 });
      } catch {
        return failure();
      }
    },
  };
}
