import test from "node:test";
import assert from "node:assert/strict";
import {
  saveLocalPrompt,
  readLocalPrompts,
  updateLocalPrompt,
  removeLocalPrompt,
  LIBRARY_KEY,
} from "../apps/web/src/lib/local-library.ts";
import {
  promptHandlers,
  type PromptStore,
} from "../apps/web/src/lib/prompt-handlers.ts";
import { generationHandler } from "../apps/web/src/lib/generation-handler.ts";
import {
  appendParams,
  parseVariations,
} from "../apps/web/src/lib/prompt-contract.ts";
const context = {
  brief: "Moon garden",
  account: null,
  platform: "midjourney",
  orientation: "portrait",
};
function memory() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}
test("browser saves survive reload, deduplicate retries and preserve context", () => {
  const storage = memory();
  const saved = saveLocalPrompt(
    storage,
    "guest_one",
    { label: "safe", prompt: "A moon garden" },
    context,
  );
  context.brief = "Changed brief";
  assert.equal(
    saveLocalPrompt(
      storage,
      "guest_one",
      { label: "safe", prompt: "Other" },
      context,
    ).id,
    saved.id,
  );
  assert.equal(readLocalPrompts(storage).length, 1);
  assert.equal(
    readLocalPrompts(storage)[0].iteration.session.brief,
    "Moon garden",
  );
  updateLocalPrompt(storage, saved.id, { rating: 1, favourite: true });
  assert.equal(readLocalPrompts(storage)[0].favourite, true);
  assert.equal(readLocalPrompts(storage)[0].rating, 1);
  removeLocalPrompt(storage, saved.id);
  assert.deepEqual(readLocalPrompts(storage), []);
});
test("corrupt browser data is retained and quota errors are actionable", () => {
  const storage = memory();
  storage.setItem(LIBRARY_KEY, "broken");
  assert.throws(
    () =>
      saveLocalPrompt(storage, "x", { label: "safe", prompt: "Moon" }, context),
    /not been overwritten/,
  );
  assert.equal(storage.getItem(LIBRARY_KEY), "broken");
  assert.throws(
    () =>
      saveLocalPrompt(
        {
          getItem: () => null,
          setItem: () => {
            throw Error("quota");
          },
        },
        "x",
        { label: "safe", prompt: "Moon" },
        context,
      ),
    /could not save/,
  );
});
const request = (body: unknown, method = "POST") =>
  new Request("https://conjure.test/api/prompts", {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "GET" ? undefined : JSON.stringify(body),
  });
function fixture(user: string | null = "owner") {
  const calls: unknown[][] = [];
  const store: PromptStore = {
    list: async (...args) => {
      calls.push(["list", ...args]);
      return [];
    },
    iterationOwner: async (...args) => {
      calls.push(["iteration", ...args]);
      return args[1] === "mine";
    },
    collectionOwner: async (...args) => {
      calls.push(["collection", ...args]);
      return false;
    },
    create: async (input) => {
      calls.push(["create", input]);
      return input;
    },
    change: async (...args) => {
      calls.push(["change", ...args]);
      return null;
    },
    remove: async (...args) => {
      calls.push(["remove", ...args]);
      return false;
    },
  };
  return { calls, handlers: promptHandlers({ user: async () => user, store }) };
}
test("anonymous account operations never touch storage", async () => {
  const { handlers, calls } = fixture(null);
  for (const response of [
    await handlers.list(request(null, "GET")),
    await handlers.save(request({})),
    await handlers.change(request({ rating: 1 }), "foreign", "rating"),
    await handlers.remove(request(null), "foreign"),
  ])
    assert.equal(response.status, 401);
  assert.deepEqual(calls, []);
});
test("save rejects foreign iterations and collections and derives owner from session", async () => {
  const { handlers, calls } = fixture();
  const input = {
    iterationId: "foreign",
    label: "safe",
    output: "Moon",
    userId: "attacker",
  };
  assert.equal((await handlers.save(request(input))).status, 404);
  assert.equal(
    (
      await handlers.save(
        request({ ...input, iterationId: "mine", collectionId: "foreign" }),
      )
    ).status,
    404,
  );
  const response = await handlers.save(
    request({ ...input, iterationId: "mine" }),
  );
  assert.equal(response.status, 201);
  assert.equal((await response.json()).userId, "owner");
  assert.equal(calls.filter((c) => c[0] === "create").length, 1);
});
test("all list and mutation queries carry authenticated ownership", async () => {
  const { handlers, calls } = fixture();
  await handlers.list(request(null, "GET"));
  assert.equal(
    (await handlers.change(request({ rating: 99 }), "foreign", "rating"))
      .status,
    400,
  );
  assert.equal(
    (await handlers.change(request({ rating: 1 }), "foreign", "rating")).status,
    404,
  );
  assert.equal(
    (
      await handlers.change(
        request({ favourite: true }),
        "foreign",
        "favourite",
      )
    ).status,
    404,
  );
  assert.equal((await handlers.remove(request(null), "foreign")).status, 404);
  for (const call of calls) assert.equal(call[1], "owner");
});
const output = JSON.stringify({
  variations: ["safe", "creative", "experimental"].map((label) => ({
    label,
    prompt: "A moon garden",
  })),
});
function generator(user: string | null = null, text = output) {
  const calls: string[] = [];
  const handler = generationHandler({
    available: () => true,
    user: async () => user,
    ownedSession: async () => {
      calls.push("ownership");
      return false;
    },
    persist: async () => {
      calls.push("persist");
      return { sessionId: "stored", iterationId: "stored" };
    },
    generate: async (input) => {
      calls.push(input.prompt);
      return text;
    },
  });
  return { handler, calls };
}
test("guest generation and refinement use guest identities without persistence", async () => {
  const { handler, calls } = generator();
  const first = await (
    await handler(
      request({ brief: "Moon", basePrompt: "Original composition" }),
    )
  ).json();
  assert.equal(first.storage, "browser");
  assert.match(first.iterationId, /^guest_/);
  assert.match(calls[0], /Original composition/);
  const refined = await (
    await handler(
      request({
        brief: "Moon",
        sessionId: first.sessionId,
        refinement: "Warmer",
        basePrompt: "Original",
      }),
    )
  ).json();
  assert.equal(refined.sessionId, first.sessionId);
  assert.notEqual(refined.iterationId, first.iterationId);
  assert.ok(!calls.includes("persist"));
});
test("invalid model replies are never persisted; foreign sessions never call model", async () => {
  const bad = generator(
    "owner",
    JSON.stringify({ variations: [{ label: "safe", prompt: "one" }] }),
  );
  assert.equal((await bad.handler(request({ brief: "Moon" }))).status, 502);
  assert.ok(!bad.calls.includes("persist"));
  const foreign = generator("owner");
  assert.equal(
    (await foreign.handler(request({ brief: "Moon", sessionId: "foreign" })))
      .status,
    404,
  );
  assert.deepEqual(foreign.calls, ["ownership"]);
});
test("malformed request and unavailable provider fail before user or model IO", async () => {
  const handler = generationHandler({
    available: () => false,
    user: async () => {
      throw Error("must not call");
    },
    ownedSession: async () => false,
    persist: async () => {
      throw Error("must not call");
    },
    generate: async () => {
      throw Error("must not call");
    },
  });
  assert.equal((await handler(request({ brief: "" }))).status, 400);
  assert.equal((await handler(request({ brief: "Moon" }))).status, 503);
});
test("platform syntax preserves user version settings and validates three distinct labels", () => {
  assert.equal(
    appendParams("Moon --ar 1:1", "midjourney", "portrait"),
    "Moon --ar 9:16",
  );
  assert.equal(appendParams("Moon", "flux", "portrait"), "Moon");
  assert.throws(() =>
    parseVariations(
      JSON.stringify({
        variations: Array(3).fill({ label: "safe", prompt: "Moon" }),
      }),
    ),
  );
});
