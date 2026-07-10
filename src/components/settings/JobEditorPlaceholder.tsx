import Link from "next/link";
import { ArrowLeft, Plus, Trash } from "@phosphor-icons/react/dist/ssr";
import { mockEditorJob } from "@/mock/interviewData";

const inputClass =
  "w-full rounded-[9px] border border-[#e2e5f0] bg-white px-3.5 py-2.5 text-sm text-[#15183f] shadow-[var(--shadow-control)] outline-none placeholder:text-[#9aa0c2]";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-[#2a3057]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[13px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)]">
      <h2 className="m-0 text-[16px] font-bold leading-6 text-[#0e1038]">{title}</h2>
      {subtitle && (
        <p className="m-0 mt-1 text-[13px] leading-5 text-[#59628c]">{subtitle}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function JobEditorPlaceholder() {
  return (
    <div className="app-shell">
      <main className="mx-auto flex max-w-[900px] flex-col gap-6 px-5 pb-16 pt-10 sm:px-6 sm:pt-12">
        <header>
          <Link
            href="/settings"
            className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={15} aria-hidden />
            All jobs
          </Link>
          <h1 className="m-0 text-[28px] font-bold leading-9 tracking-[-0.7px] text-[#080a31]">
            Job editor
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#59628c]">
            Static form preview. Saving is intentionally disabled in this phase.
          </p>
        </header>

        <Card title="Job" subtitle="What the candidate sees when choosing a role.">
          <div className="flex flex-col gap-4">
            <Field label="Title">
              <input className={inputClass} value={mockEditorJob.title} readOnly />
            </Field>
            <Field label="Description">
              <textarea
                className={`${inputClass} min-h-[84px] resize-y`}
                value={mockEditorJob.description}
                readOnly
              />
            </Field>
          </div>
        </Card>

        <Card title="Interviewer persona" subtitle="Tone and focus for this role.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Name">
              <input className={inputClass} value={mockEditorJob.persona.name} readOnly />
            </Field>
            <Field label="Tone">
              <input className={inputClass} value={mockEditorJob.persona.tone} readOnly />
            </Field>
            <Field label="Focus">
              <input className={inputClass} value={mockEditorJob.persona.focus} readOnly />
            </Field>
          </div>
        </Card>

        <Card title="Skills to probe" subtitle="Registered skills anchor the evaluation.">
          <div className="flex flex-col gap-2">
            {mockEditorJob.skills.map(([label, tier, dimension]) => (
              <div
                key={label}
                className="grid gap-2 rounded-[9px] border border-[var(--border-soft)] bg-[#fbfbff] px-3.5 py-2.5 sm:grid-cols-[1fr_auto_auto]"
              >
                <span className="min-w-0 truncate text-sm text-[#22284f]">{label}</span>
                <span className="w-fit rounded-[6px] border border-[#c8f0dc] bg-[var(--success-soft)] px-2 py-0.5 text-[11px] font-medium text-[#0f8a55]">
                  {tier}
                </span>
                <span className="w-fit rounded-[6px] bg-[#f4f4fb] px-2 py-0.5 text-[11px] font-medium text-[#59628c]">
                  {dimension}
                </span>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled
            className="mt-4 inline-flex h-[42px] items-center gap-1.5 rounded-[9px] border border-[#8183ff] bg-white px-3.5 text-[13px] font-medium text-[#5255ed] opacity-60"
          >
            <Plus size={15} aria-hidden />
            Add skill
          </button>
        </Card>

        <Card title="Question bank" subtitle="Questions selected and adapted by the interviewer.">
          <div className="flex flex-col gap-2">
            {mockEditorJob.questions.map(([category, text]) => (
              <div
                key={text}
                className="grid gap-3 rounded-[9px] border border-[var(--border-soft)] bg-[#fbfbff] px-3.5 py-2.5 sm:grid-cols-[120px_1fr]"
              >
                <span className="w-fit rounded-[6px] bg-[#f4f4fb] px-2 py-0.5 text-[11px] font-medium text-[#59628c]">
                  {category}
                </span>
                <span className="text-sm leading-6 text-[#22284f]">{text}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            disabled
            className="inline-flex h-10 items-center gap-2 rounded-[9px] border border-[#ffd9d8] bg-white px-4 text-[13px] font-medium text-[#ba3633] opacity-60"
          >
            <Trash size={15} aria-hidden />
            Delete job
          </button>
          <button
            type="button"
            disabled
            className="inline-flex h-10 items-center rounded-[9px] bg-[image:var(--gradient-button)] px-6 text-[13px] font-medium text-white opacity-70 shadow-[var(--shadow-button)]"
          >
            Save changes
          </button>
        </div>
      </main>
    </div>
  );
}
