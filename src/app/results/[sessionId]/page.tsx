import Link from "next/link";
import { notFound } from "next/navigation";
import { FinalEvaluation } from "@/components/results/FinalEvaluation";
import { Transcript } from "@/components/results/Transcript";
import { toClientSession } from "@/lib/serializers";
import { loadSession } from "@/services/interview/loadSession";

export const dynamic = "force-dynamic";

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[12px] border border-[#e5e7f1] bg-[#fbfbff] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  try {
    const session = await loadSession(sessionId);
    const clientSession = toClientSession(session);
    const answeredQuestions = session.turns.filter(
      (turn) => turn.answerTranscript !== null,
    ).length;
    const statusLabel =
      session.status === "completed" ? "Completed" : "In progress";

    return (
      <div className="app-shell">
        <main className="mx-auto max-w-[1180px] px-5 py-10 sm:px-6">
          <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--primary)]">
                {clientSession.jobTitle}
              </p>
              <h1 className="mt-2 text-[32px] font-bold leading-10 tracking-[-0.8px] text-[var(--text-primary)]">
                Interview results
              </h1>
              <p className="mt-2 max-w-[720px] text-sm leading-6 text-[var(--text-secondary)]">
                {session.status === "completed"
                  ? "Completed interview record. This page is read-only."
                  : "Read-only interview record. In-progress sessions cannot be resumed from here."}
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-[9px] border border-[#d8dbf0] bg-white px-4 text-sm font-medium text-[var(--primary)] transition hover:bg-[#f7f6ff]"
            >
              All roles
            </Link>
          </header>

          <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Status" value={statusLabel} />
            <StatCard
              label="Started"
              value={formatDate(session.createdAt)}
            />
            <StatCard
              label="Answered questions"
              value={`${answeredQuestions} of ${session.turns.length}`}
            />
            <StatCard
              label="Final score"
              value={
                session.finalEvaluation
                  ? `${session.finalEvaluation.overallScore}/100`
                  : "Not available"
              }
            />
          </section>

          <div className="flex flex-col gap-6">
            {clientSession.finalEvaluation ? (
              <FinalEvaluation evaluation={clientSession.finalEvaluation} />
            ) : (
              <section className="rounded-[14px] border border-[#ffe0bd] bg-[var(--warning-soft)] p-5 text-sm leading-6 text-[#9d570d] shadow-[var(--shadow-card)]">
                This interview is not complete yet, so there is no final
                evaluation.
              </section>
            )}
            <Transcript turns={clientSession.turns} />
          </div>
        </main>
      </div>
    );
  } catch {
    notFound();
  }
}
