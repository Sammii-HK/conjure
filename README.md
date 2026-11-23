# Conjure

An image-prompt studio for Midjourney, FLUX and DALL·E. Describe what you want in plain English, get three directions (straightforward, creative and experimental), refine the one you like and keep your favourites in a library.

Built as a personal tool for my own image generation workflow.

## Features

- **Three directions** from one brief: straightforward, creative and experimental
- **Multi-platform**: Midjourney, FLUX and DALL·E, with the Midjourney aspect ratio added for you
- **Style profiles**: style hints per social account
- **Composition**: portrait, square or landscape
- **Refinement**: refine any direction with a follow-up instruction, keeping the original brief and settings
- **Library**: save, rate, favourite, search and remix prompts
- **Chrome extension**: a side panel on midjourney.com that can place a prompt into the prompt field

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Monorepo | Turborepo + pnpm workspaces |
| AI | Groq (Llama 3.3 70B) via the Vercel AI SDK |
| Database | Prisma 6 + PostgreSQL |
| Auth | Better Auth |
| Styling | Tailwind CSS, Lucide icons |
| Extension | Chrome MV3, Vite + React |

## Project structure

```
conjure/
├── apps/
│   ├── web/          # Next.js app
│   └── extension/    # Chrome MV3 extension
├── site-quality/     # Icon lint
├── tests/
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Getting started

```bash
pnpm install
# set the environment variables below in apps/web/.env
pnpm dev
```

### Environment variables

```env
GROQ_API_KEY=
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_APP_URL=
```

Without `GROQ_API_KEY` the studio still loads and shows a friendly message instead of generating. Without the auth and database values, saved prompts are kept in the browser.

### Checks

```bash
pnpm test
pnpm lint
pnpm type-check
pnpm build
```

### Chrome extension

```bash
pnpm --filter @conjure/extension build
# Load apps/extension/dist as an unpacked extension in Chrome
```

The extension talks to the production app set in `apps/extension/config.ts`.

## Deployment

Deployed on Vercel with the root directory set to `apps/web`.

---

Built by [Sammii](https://github.com/sammii-hk).
