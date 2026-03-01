import Link from "next/link";
import { Wand2 } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#0a0a0f" }}>
      <div className="text-center space-y-4">
        <Wand2 className="h-10 w-10 text-accent mx-auto opacity-50" />
        <h1 className="text-2xl font-bold text-text">Page not found</h1>
        <p className="text-text-muted">That spell didn&apos;t conjure anything.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          Back to Conjure
        </Link>
      </div>
    </div>
  );
}
