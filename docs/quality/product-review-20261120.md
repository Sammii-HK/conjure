# Conjure product review, 20 November 2026

Source baseline: `0ca070b`. Worktree: `codex/conjure-product-polish`.

## Behaviour repaired

Guest generation now returns explicit browser identities. Save and rating actions persist the generated variation and its original brief/settings in this browser, without a database identity. Retrying a browser save deduplicates by iteration and direction. Favourites, search, profile/rating filters, copy and remix work from the same local shelf. Storage read/quota failures are visible and malformed data is not overwritten. Browser records are not backed up or account-synced.

Authenticated generation persists a user-owned session and iteration. Every library operation scopes storage queries to the authenticated user, including iteration/collection ownership before save. No new login interface was added. The existing authentication service and account routes remain, but require proper deployment configuration.

Generation validates its input and all three distinct model directions, preserves refinement context and includes a remixed prompt as reference. Only Midjourney receives the selected aspect-ratio flag. No Midjourney model version or stylisation is forced. FLUX/DALL·E dimensions belong to the image tool.

The studio and library share navigation, clear headings, visible actions, labelled fields, readable empty/error states, reduced-motion support and Lucide icons. Copy failure does not silently discard a prompt.

The extension packages its actual React panel instead of embedding localhost. Its standalone content script accepts messages only from its own iframe and extension origin; the panel accepts acknowledgements only from the Midjourney parent/origin. Text insertion is bounded, does not submit images, and reports when the field cannot be found. The production API host is explicit. Wildcard extension authentication trust and nonexistent manifest icon paths were removed. The panel has no library sync and says drafts are temporary.

## Verification and boundaries

Eleven injected/mocked tests cover browser persistence/reload/deduplication, corrupt/quota storage, authenticated ownership and anonymous rejection, invalid model output, guest generation/refinement, provider absence, platform syntax and extension message validation. Eight shared icon regressions pass; both apps have zero icon violations. Both TypeScript checks and web production/extension package builds pass. Prisma generation used only the checked-out schema to generate local code. No database command, provider request, environment file, schema change, push or deployment was used.

Browser production-preview checks confirmed desktop studio/library navigation, visible provider-unavailable feedback and platform-specific guidance. At 390px, studio and library content measured 384px, with no horizontal overflow; viewport override was reset. No AI output was fabricated. The lockfile was migrated from legacy format6 to pnpm9 format9 to match the already-declared package manager, with Lucide added to the extension.

Extension build verification checks every manifest entry and the packaged panel, and rejects module imports/localhost in the standalone content script. It was not installed into Chrome or tested against the current live Midjourney DOM. Production generation and authenticated database persistence were not exercised. These need target-confirmed integration checks before release.

The initial dependency audit reports substantial pre-existing findings, recorded separately during the following bounded dependency pass. Passing builds and mocked ownership tests do not establish production readiness.
