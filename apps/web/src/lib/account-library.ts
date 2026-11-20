import { promptHandlers, type PromptStore } from "./prompt-handlers.ts";
async function db() {
  return (await import("./prisma")).prisma;
}
export async function accountUser(request: Request) {
  if (!request.headers.has("cookie")) return null;
  const { auth } = await import("./auth");
  return (
    (await auth.api.getSession({ headers: request.headers }))?.user.id ?? null
  );
}
const store: PromptStore = {
  list: async (userId, filters) =>
    (await db()).prompt.findMany({
      where: {
        userId,
        saved: true,
        ...(filters.account
          ? { iteration: { session: { account: filters.account } } }
          : {}),
        ...(filters.rating !== undefined ? { rating: filters.rating } : {}),
        ...(filters.favourites ? { favourite: true } : {}),
      },
      include: { iteration: { include: { session: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  iterationOwner: async (userId, id) =>
    !!(await (
      await db()
    ).promptIteration.findFirst({
      where: { id, session: { userId } },
      select: { id: true },
    })),
  collectionOwner: async (userId, id) =>
    !!(await (
      await db()
    ).collection.findFirst({ where: { id, userId }, select: { id: true } })),
  create: async (input) =>
    (await db()).prompt.create({
      data: input,
      include: { iteration: { include: { session: true } } },
    }),
  change: async (userId, id, patch) => {
    const prisma = await db();
    const changed = await prisma.prompt.updateMany({
      where: { id, userId },
      data: patch,
    });
    return changed.count
      ? prisma.prompt.findFirst({
          where: { id, userId },
          include: { iteration: { include: { session: true } } },
        })
      : null;
  },
  remove: async (userId, id) =>
    (await (await db()).prompt.deleteMany({ where: { id, userId } })).count > 0,
};
export const libraryHandlers = promptHandlers({ user: accountUser, store });
