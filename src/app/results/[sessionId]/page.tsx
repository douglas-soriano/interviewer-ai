import Link from "next/link";
import { FinalEvaluation } from "@/components/results/FinalEvaluation";
import { Transcript } from "@/components/results/Transcript";
import { mockEvaluation, mockTurns } from "@/mock/interviewData";

export default function ResultsPage() {
  return (
    <div className="app-shell">
      <main className="mx-auto max-w-[1180px] px-5 py-10 sm:px-6">
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--primary)]">
              Senior Backend Engineer
            </p>
            <h1 className="mt-2 text-[32px] font-bold leading-10 tracking-[-0.8px] text-[var(--text-primary)]">
              Interview results
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Read-only placeholder report for the static interview shell.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-[9px] border border-[#d8dbf0] bg-white px-4 text-sm font-medium text-[var(--primary)] transition hover:bg-[#f7f6ff]"
          >
            All roles
          </Link>
        </header>

        <div className="flex flex-col gap-6">
          <FinalEvaluation evaluation={mockEvaluation} />
          <Transcript turns={mockTurns} />
        </div>
      </main>
    </div>
  );
}
