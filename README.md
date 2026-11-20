# Conjure

A personal image-prompt studio. Turn a brief into three directions, refine one, then copy the text into Midjourney, FLUX or DALL·E. Conjure generates prompt text, not images.

## Current behaviour

- Three directions: straightforward, creative and experimental. These are interpretations, not guarantees of image quality.
- Style profiles and portrait/square/landscape composition. Midjourney receives `--ar`; model/version settings stay yours. Set FLUX and DALL·E dimensions in their own tools.
- Refinement keeps the original brief and settings. Remix includes the saved text as a reference.
- Save, rate, favourite, search and remix on this browser. Browser saves are not backed up or account-synced; clearing browser storage removes them.
- Existing authenticated account APIs use user-owned sessions, iterations and saved records. No sign-in interface or collections management interface is currently supplied.
- Chrome MV3 side panel targets `https://www.midjourney.com`. It calls the production Conjure service for prompt text and can place text into a recognised prompt field without submitting it. Copy is the fallback. Panel drafts are temporary and do not sync with the web library.

## Development and checks

Node 24 and pnpm 9.15 are used for the local verification. Install locked dependencies, then run `pnpm test`, `pnpm test:icons`, `pnpm test:auth-compat`, `pnpm lint` and `pnpm type-check`. `pnpm build` checks icons and builds both apps. Local Prisma client generation is code generation only; database operations require an explicitly confirmed target.

The web service uses Next.js 15, React 19, Tailwind, Lucide, Prisma/PostgreSQL, Better Auth and Groq through the Vercel AI SDK. Generation needs a configured provider; without it, the studio gives an unavailable message while browser saves remain usable. Account operations additionally require a configured authentication service and database. Configuration values belong in the deployment's secret management, not committed files.

Build the extension with `pnpm --filter @conjure/extension build`. Its verified unpacked output is `apps/extension/dist`; loading it in Chrome grants its declared permissions and should be reviewed separately. The production service address is explicit in `apps/extension/config.ts` and its host permission must match.

See [the dependency review](docs/quality/dependency-review-20261120.md) for residual breaking-upgrade findings. See [the dated product review](docs/quality/product-review-20261120.md) for tested paths and integration limitations.

Built by [Sammii](https://github.com/sammii-hk).
