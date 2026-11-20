import test from "node:test";
import assert from "node:assert/strict";
import {
  trustedMessage,
  validPrompt,
  API_URL,
  HOST_ORIGIN,
} from "../apps/extension/config.ts";
test("extension injection accepts only its exact iframe and trusted origin", () => {
  const frame = {} as Window;
  const other = {} as Window;
  const data = { type: "CONJURE_INJECT_PROMPT", prompt: "Moon" };
  assert.equal(
    trustedMessage(
      { source: frame, origin: HOST_ORIGIN, data },
      frame,
      HOST_ORIGIN,
    ),
    true,
  );
  assert.equal(
    trustedMessage(
      { source: other, origin: HOST_ORIGIN, data },
      frame,
      HOST_ORIGIN,
    ),
    false,
  );
  assert.equal(
    trustedMessage(
      { source: frame, origin: "https://attacker.test", data },
      frame,
      HOST_ORIGIN,
    ),
    false,
  );
  assert.equal(
    trustedMessage(
      { source: null, origin: HOST_ORIGIN, data },
      null,
      HOST_ORIGIN,
    ),
    false,
  );
  assert.equal(
    trustedMessage(
      { source: frame, origin: HOST_ORIGIN, data: null },
      frame,
      HOST_ORIGIN,
    ),
    false,
  );
});
test("injection payload is bounded text; production API uses HTTPS", () => {
  for (const input of [null, {}, "", "   ", "x".repeat(10001)])
    assert.equal(validPrompt(input), false);
  assert.equal(validPrompt("A moon garden"), true);
  assert.equal(new URL(API_URL).protocol, "https:");
  assert.equal(new URL(API_URL).hostname, "conjure-two.vercel.app");
});
