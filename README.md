# Conjure

AI-powered prompt builder for Midjourney, FLUX, and DALL·E. Generate three prompt variations (safe, creative, experimental) from a plain-English brief, refine them iteratively, and save your favourites to a personal library.

Built as a personal tool for my own image generation workflow.

![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=next.js)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=flat-square&logo=turborepo&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)

## Features

- **Prompt generation** — describe what you want in plain English, get 3 variations tuned for safe/creative/experimental outputs
- **Multi-platform** — Midjourney (v6.1), FLUX.1, and DALL·E 3 with correct parameter formatting per platform
- **Account style context** — style hints per social persona (e.g. ethereal lifestyle, witchy illustration, cosmic astrology)
- **Orientation control** — portrait, square, or landscape with correct `--ar` params appended automatically
- **Iterative refinement** — refine any prompt with a follow-up instruction, keeping session context
- **Library** — save, rate, and favourite prompts; organise into collections
- **Chrome extension** — inject the prompt builder into any page (Midjourney Discord, etc.)

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Monorepo | Turborepo + pnpm workspaces |
| AI | Groq API (Llama 3.3 70B) via Vercel AI SDK |
| Database | Prisma 6 + PostgreSQL (Neon) |
| Auth | better-auth 1.2.5 |
| Styling | Tailwind CSS |
| Extension | Chrome MV3, Vite + React |

## Project structure

```
conjure/
├── apps/
│   ├── web/          # Next.js app
│   └── extension/    # Chrome MV3 extension
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Getting started

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL database (Neon recommended)
- Groq API key (free tier at console.groq.com)

### Setup

```bash
# Install dependencies
pnpm install

# Generate Prisma client
cd apps/web && npx prisma generate

# Copy and fill in env vars
cp apps/web/.env.example apps/web/.env
```

### Environment variables

```env
DATABASE_URL=
GROQ_API_KEY=
NEXT_PUBLIC_APP_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
EXTENSION_API_KEY=
```

### Database

```bash
cd apps/web
npx prisma migrate dev
```

### Run

```bash
pnpm dev
```

### Build Chrome extension

```bash
cd apps/extension
pnpm build
# Load apps/extension/dist as an unpacked extension in Chrome
```

## Deployment

Deployed on Vercel. Set root directory to `apps/web` in Vercel project settings, and add all env vars from above.

---

Built by [Sammii](https://github.com/sammii-hk)
