import Link from "next/link";
import { ArrowLeft, Plus } from "@phosphor-icons/react/dist/ssr";
import type { Job } from "@/domain/session";

export function SettingsList({ jobs }: { jobs: Job[] }) {
  return (
    <div className="app-shell">
      <main className="mx-auto max-w-[860px] px-6 pb-16 pt-12">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              <ArrowLeft size={15} aria-hidden />
              Back to roles
            </Link>
            <h1 className="m-0 text-[28px] font-bold leading-9 tracking-[-0.7px] text-[#080a31]">
              Job settings
            </h1>
            <p className="m-0 mt-2 max-w-[540px] text-sm leading-6 text-[#59628c]">
              Each job defines the skills the interviewer must probe and the
              question bank it adapts. The evaluation stays anchored to exactly
              what you register here.
            </p>
          </div>
          <Link
            href="/settings/new"
            className="inline-flex h-10 items-center gap-2 rounded-[9px] bg-[image:var(--gradient-button)] px-4 text-[13px] font-medium text-white shadow-[var(--shadow-button)] transition hover:shadow-[0_8px_18px_rgb(70_68_232/0.24)]"
          >
            <Plus size={16} aria-hidden />
            New job
          </Link>
        </header>

        <div className="overflow-hidden rounded-[13px] border border-[var(--border)] bg-white shadow-[var(--shadow-card)]">
          {jobs.map((job) => {
            const essential = job.skills.filter((skill) => skill.tier === "essential")
              .length;

            return (
              <Link
                key={job.id}
                href={`/settings/${job.id}`}
                className="flex items-center gap-4 border-b border-[var(--border-soft)] px-5 py-4 transition last:border-b-0 hover:bg-[#fafaff]"
              >
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-[14px] font-semibold leading-5 text-[#22284f]">
                    {job.title}
                  </p>
                  <p className="m-0 mt-0.5 line-clamp-1 text-xs leading-5 text-[#7e85a7]">
                    {job.description}
                  </p>
                </div>
                <span className="shrink-0 rounded-[6px] bg-[var(--primary-soft)] px-2.5 py-1 text-[11px] font-medium text-[#615cf2]">
                  {job.skills.length} skills · {essential} essential
                </span>
                <span className="shrink-0 rounded-[6px] bg-[#f4f4fb] px-2.5 py-1 text-[11px] font-medium text-[#59628c]">
                  {job.questions.length} questions
                </span>
              </Link>
            );
          })}
          {jobs.length === 0 && (
            <p className="px-5 py-8 text-sm text-[var(--text-secondary)]">
              No jobs yet. Create the first one.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
