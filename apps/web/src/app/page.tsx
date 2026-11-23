import { PromptBuilder } from "@/components/PromptBuilder";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ brief?: string; base?: string }>;
}) {
  const params = await searchParams;
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <header className="mb-10 max-w-3xl">
        <p className="mb-4 text-xs uppercase tracking-[.22em] text-accent-text">
          A little more intention, before the image
        </p>
        <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
          Give the idea
          <br />
          <span className="text-text-muted">a clearer direction.</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-text-muted">
          Turn a brief into three image prompts. Compare the interpretations,
          refine what interests you and keep the ones you want to use.
        </p>
      </header>
      <PromptBuilder
        initialBrief={params.brief ?? ""}
        initialPrompt={params.base ?? ""}
      />
    </main>
  );
}
