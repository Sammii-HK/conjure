# Conjure dependency review, 20 November 2026

Separate follow-up to product batch `7cf0d8a`. No major upgrade, schema change, database operation, provider request or release was performed.

## Compatible updates

Next and its matching ESLint configuration moved from 15.5.12 to 15.5.29. Better Auth moved from 1.2.5 to 1.7.27 within major 1. Other dependencies were refreshed within their existing major/range constraints, including React 19.3.1, Prisma 6.19.3 and Vite 6.4.6. AI SDK stays 4.3.19; application validation stays Zod 3.25.76.

Two explicit, scoped resolutions patch otherwise pinned transitive dependencies: `next@15.5.29>postcss` uses 8.5.33, and `@prisma/config@6.19.3>effect` uses 3.22.1. Both stay within their prior major. Build and local Prisma code generation verify these resolutions; they do not bypass security or runtime checks. Reassess the resolutions when their parent packages update.

Better Auth's router requires Zod 4, while the older AI SDK/application uses Zod 3. A narrowly scoped package extension supplies `better-call@1.4.6` with Zod 4.6.7 rather than changing the application major. A regression checks the actual resolved router dependency is4 and the application's is3. pnpm 9 still prints an optional-peer warning inherited through core's peer context; the actual runtime path and auth/session fixture are verified, rather than hiding that warning.

Authentication routes now load their implementation only when account configuration is present, and return 503 when it is absent. This avoids initialising default-secret authentication during unconfigured builds. Existing configured account behaviour is retained; no sign-in UI or provider was added.

## Audit evidence

Counts below are pnpm advisory findings, not unique affected packages or claims of exploitability. All audits ran against lockfiles, without installing into the owner's checkout.

| Scope | Before | After |
| --- | --- | --- |
| Full graph | 5 critical, 63 high, 41 moderate, 12 low | 0 critical, 3 high, 1 moderate, 2 low |
| Production dependency graph | 5 critical, 40 high, 20 moderate, 8 low | 0 critical, 3 high, 1 moderate, 2 low |

The full-graph baseline is the product commit's audit; production baseline was independently recreated from only that commit's package manifests/workspace file/lockfile in an isolated temporary directory. No environment files were copied. pnpm includes Prisma's configuration/build helpers in the production graph through client peer relationships; this graph classification does not prove those code paths ship in a deployed server bundle.

Remaining findings require a separately reviewed breaking dependency transition:

| Installed package | Finding | Patched line |
| --- | --- | --- |
| `ai@4.3.19` | Low, upload filetype whitelist bypass | AI SDK 5.0.52+ |
| `@ai-sdk/provider-utils@2.2.8` | Low, uncontrolled resource consumption | provider-utils 3.0.28+ |
| `zod@3.25.76` | High, oversized constrained-collection memory exhaustion | Zod 4.6.6+ |
| `jsondiffpatch@0.6.0` through AI SDK 4 | Moderate HTML formatter XSS; high patch API prototype pollution | 0.7.2+/0.7.6+, outside installed 0.6 range |
| `deepmerge-ts@7.1.5` through Prisma 6 config | High, stack exhaustion for recursive graphs | deepmerge-ts 8.0.0+ |

The current UI submits prompt text and does not expose file uploads, HTML diff rendering or arbitrary recursive merge objects. This narrows observed application surface, but these findings remain in the audit and are not suppressed. A clean security audit is not claimed.

## Validation

Both app lint/type checks, guarded web production build, extension package verification, eleven mocked workflow/trust tests and eight shared icon regressions pass. Three additional checks validate updated auth core fields against generated metadata from the unchanged local Prisma schema, sign-up/session resolution using in-memory fixture IO, and separate Zod peer resolution. No real account or database was used. Fresh locked installation also succeeds with scripts disabled. Production HTTP smoke checks return 200 for studio/library, 401 for the guest account library, and clear 503 responses for unconfigured account access and unavailable generation. Live authentication/provider integration and a real installed Midjourney extension still need their own authorised checks.

## Sources

- [Next 15.5.29 security release](https://github.com/vercel/next.js/releases/tag/v15.5.29).
- [Better Auth 1.7.27 release](https://github.com/better-auth/better-auth/releases/tag/v1.7.27) and [core database fields](https://better-auth.com/docs/concepts/database).
- [Effect fix in 3.22.1](https://github.com/advisories/GHSA-7589-6fvf-x4pw).
- [PostCSS source-map fix](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp).
- [Zod 4.6.6 fix](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
- [AI SDK upload advisory](https://github.com/advisories/GHSA-rwvc-j5jr-mgvh), [provider-utils advisory](https://github.com/advisories/GHSA-866g-f22w-33x8), [jsondiffpatch XSS](https://github.com/advisories/GHSA-33vc-wfww-vjfv), [jsondiffpatch prototype pollution](https://github.com/advisories/GHSA-j4fx-xxwh-2485), [deepmerge-ts advisory](https://github.com/advisories/GHSA-ggr8-5vv4-36mx).
