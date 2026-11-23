import { Library } from "@/components/Library";
export default function LibraryPage() {
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[.22em] text-accent-text">
          Your prompt library
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Worth another look.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-text-muted">
          The prompts you kept, ready to copy, compare and take in a different
          direction.
        </p>
      </header>
      <Library />
    </main>
  );
}
