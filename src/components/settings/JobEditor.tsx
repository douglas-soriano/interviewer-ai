"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash, X } from "@phosphor-icons/react";
import type {
  Dimension,
  QuestionCategory,
  SkillTier,
} from "@/domain/interview";

export interface JobEditorData {
  id: string | null;
  title: string;
  description: string;
  persona: { name: string; tone: string; focus: string };
  skills: { id?: string; label: string; tier: SkillTier; dimension: Dimension }[];
  questions: { id?: string; category: QuestionCategory; text: string }[];
}

const TIERS: { value: SkillTier; label: string }[] = [
  { value: "essential", label: "Essential" },
  { value: "good_to_have", label: "Good to have" },
  { value: "bonus", label: "Bonus" },
];

const DIMENSIONS: { value: Dimension; label: string }[] = [
  { value: "technical", label: "Technical" },
  { value: "ownership", label: "Ownership" },
  { value: "culture", label: "Culture fit" },
];

const CATEGORIES: { value: QuestionCategory; label: string }[] = [
  { value: "technical", label: "Technical" },
  { value: "ownership", label: "Ownership" },
  { value: "red_flag", label: "Red flags" },
  { value: "culture", label: "Culture fit" },
];

const TIER_CHIP: Record<SkillTier, string> = {
  essential: "border-[#c8f0dc] bg-[var(--success-soft)] text-[#0f8a55]",
  good_to_have: "border-[#dddfff] bg-[var(--primary-soft)] text-[#5555ee]",
  bonus: "border-[#ffe0bd] bg-[var(--warning-soft)] text-[#b95d00]",
};

const inputClass =
  "w-full rounded-[9px] border border-[#e2e5f0] bg-white px-3.5 py-2.5 text-sm text-[#15183f] shadow-[var(--shadow-control)] outline-none transition placeholder:text-[#9aa0c2] focus:border-[#7375f7] focus:shadow-[0_0_0_3px_rgb(82_84_248/0.10)]";

const selectClass =
  "rounded-[9px] border border-[#e2e5f0] bg-white px-3 py-2.5 text-[13px] text-[#374064] shadow-[var(--shadow-control)] outline-none transition focus:border-[#7375f7]";

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

export function JobEditor({ initial }: { initial: JobEditorData }) {
  const router = useRouter();
  const isNew = initial.id === null;

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [persona, setPersona] = useState(initial.persona);
  const [skills, setSkills] = useState(initial.skills);
  const [questions, setQuestions] = useState(initial.questions);

  const [newSkill, setNewSkill] = useState("");
  const [newSkillTier, setNewSkillTier] = useState<SkillTier>("essential");
  const [newSkillDimension, setNewSkillDimension] =
    useState<Dimension>("technical");

  const [newQuestion, setNewQuestion] = useState("");
  const [newQuestionCategory, setNewQuestionCategory] =
    useState<QuestionCategory>("technical");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkCategory, setBulkCategory] =
    useState<QuestionCategory>("technical");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSkill = () => {
    const label = newSkill.trim();
    if (!label) return;

    setSkills((current) => [
      ...current,
      { label, tier: newSkillTier, dimension: newSkillDimension },
    ]);
    setNewSkill("");
  };

  const addQuestion = () => {
    const text = newQuestion.trim();
    if (!text) return;

    setQuestions((current) => [
      ...current,
      { category: newQuestionCategory, text },
    ]);
    setNewQuestion("");
  };

  const addBulkQuestions = () => {
    const lines = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    setQuestions((current) => [
      ...current,
      ...lines.map((text) => ({ category: bulkCategory, text })),
    ]);
    setBulkText("");
    setBulkOpen(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        isNew ? "/api/admin/jobs" : `/api/admin/jobs/${initial.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            persona,
            skills,
            questions,
          }),
        },
      );

      const json = await response.json();
      if (!json.success) {
        setError(json.message ?? "Could not save the job.");
        return;
      }

      router.push("/settings");
      router.refresh();
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (isNew) return;
    if (!window.confirm("Delete this job? This cannot be undone.")) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/jobs/${initial.id}`, {
        method: "DELETE",
      });
      const json = await response.json();

      if (!json.success) {
        setError(json.message ?? "Could not delete the job.");
        return;
      }

      router.push("/settings");
      router.refresh();
    } catch {
      setError("Network error while deleting.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell">
      <main className="mx-auto flex max-w-[860px] flex-col gap-6 px-6 pb-16 pt-12">
        <header>
          <Link
            href="/settings"
            className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={15} aria-hidden />
            All jobs
          </Link>
          <h1 className="m-0 text-[28px] font-bold leading-9 tracking-[-0.7px] text-[#080a31]">
            {isNew ? "New job" : `Edit: ${initial.title}`}
          </h1>
        </header>

        <Card title="Job" subtitle="What the candidate sees when picking a role.">
          <div className="flex flex-col gap-4">
            <Field label="Title">
              <input
                className={inputClass}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Senior Backend Engineer"
              />
            </Field>
            <Field label="Description">
              <textarea
                className={`${inputClass} min-h-[84px] resize-y`}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What this role owns and what the interview cares about."
              />
            </Field>
          </div>
        </Card>

        <Card
          title="Interviewer persona"
          subtitle="Tone and focus injected into the interviewer for this job."
        >
          <div className="flex flex-col gap-4">
            <Field label="Name">
              <input
                className={inputClass}
                value={persona.name}
                onChange={(event) =>
                  setPersona({ ...persona, name: event.target.value })
                }
                placeholder="Dana"
              />
            </Field>
            <Field label="Tone">
              <input
                className={inputClass}
                value={persona.tone}
                onChange={(event) =>
                  setPersona({ ...persona, tone: event.target.value })
                }
                placeholder="Direct, technically curious..."
              />
            </Field>
            <Field label="Focus">
              <input
                className={inputClass}
                value={persona.focus}
                onChange={(event) =>
                  setPersona({ ...persona, focus: event.target.value })
                }
                placeholder="Push for concrete systems and real trade-offs..."
              />
            </Field>
          </div>
        </Card>

        <Card
          title="Skills to probe"
          subtitle="Essential skills are prioritized first and carry the most weight."
        >
          <div className="flex flex-col gap-2">
            {skills.map((skill, index) => (
              <div
                key={skill.id ?? `new-${index}`}
                className="flex items-center gap-3 rounded-[9px] border border-[var(--border-soft)] bg-[#fbfbff] px-3.5 py-2.5"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-[#22284f]">
                  {skill.label}
                </span>
                <span
                  className={`shrink-0 rounded-[6px] border px-2 py-0.5 text-[11px] font-medium ${TIER_CHIP[skill.tier]}`}
                >
                  {TIERS.find((tier) => tier.value === skill.tier)?.label}
                </span>
                <span className="shrink-0 rounded-[6px] bg-[#f4f4fb] px-2 py-0.5 text-[11px] font-medium text-[#59628c]">
                  {DIMENSIONS.find(
                    (dimension) => dimension.value === skill.dimension,
                  )?.label}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSkills((current) =>
                      current.filter((_, currentIndex) => currentIndex !== index),
                    )
                  }
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-[7px] text-[#9aa0c2] transition hover:bg-[var(--danger-soft)] hover:text-[#b3312e]"
                  aria-label={`Remove skill: ${skill.label}`}
                >
                  <X size={14} aria-hidden />
                </button>
              </div>
            ))}
            {skills.length === 0 && (
              <p className="text-[13px] text-[var(--text-muted)]">
                No skills yet. Add at least one so the interview has something
                concrete to evaluate.
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <input
              className={`${inputClass} min-w-[220px] flex-1`}
              value={newSkill}
              onChange={(event) => setNewSkill(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addSkill();
                }
              }}
              placeholder="e.g. Systems design and data-modeling trade-offs"
            />
            <select
              className={selectClass}
              value={newSkillTier}
              onChange={(event) =>
                setNewSkillTier(event.target.value as SkillTier)
              }
              aria-label="Skill tier"
            >
              {TIERS.map((tier) => (
                <option key={tier.value} value={tier.value}>
                  {tier.label}
                </option>
              ))}
            </select>
            <select
              className={selectClass}
              value={newSkillDimension}
              onChange={(event) =>
                setNewSkillDimension(event.target.value as Dimension)
              }
              aria-label="Skill dimension"
            >
              {DIMENSIONS.map((dimension) => (
                <option key={dimension.value} value={dimension.value}>
                  {dimension.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addSkill}
              className="inline-flex h-[42px] items-center gap-1.5 rounded-[9px] border border-[#8183ff] bg-white px-3.5 text-[13px] font-medium text-[#5255ed] transition hover:bg-[#f7f6ff]"
            >
              <Plus size={15} aria-hidden />
              Add skill
            </button>
          </div>
        </Card>

        <Card
          title="Question bank"
          subtitle="Registered prompts make interviews more consistent while follow-ups stay adaptive."
        >
          <div className="flex flex-col gap-2">
            {questions.map((question, index) => (
              <div
                key={question.id ?? `new-${index}`}
                className="flex items-start gap-3 rounded-[9px] border border-[var(--border-soft)] bg-[#fbfbff] px-3.5 py-2.5"
              >
                <span className="mt-0.5 shrink-0 rounded-[6px] bg-[#f4f4fb] px-2 py-0.5 text-[11px] font-medium text-[#59628c]">
                  {CATEGORIES.find(
                    (category) => category.value === question.category,
                  )?.label}
                </span>
                <span className="min-w-0 flex-1 text-sm leading-6 text-[#22284f]">
                  {question.text}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuestions((current) =>
                      current.filter(
                        (_, currentIndex) => currentIndex !== index,
                      ),
                    )
                  }
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-[7px] text-[#9aa0c2] transition hover:bg-[var(--danger-soft)] hover:text-[#b3312e]"
                  aria-label="Remove question"
                >
                  <X size={14} aria-hidden />
                </button>
              </div>
            ))}
            {questions.length === 0 && (
              <p className="text-[13px] text-[var(--text-muted)]">
                No questions yet. The interviewer will improvise unless you
                register a bank here.
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <input
              className={`${inputClass} min-w-[220px] flex-1`}
              value={newQuestion}
              onChange={(event) => setNewQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addQuestion();
                }
              }}
              placeholder="e.g. Tell me about a production incident you handled."
            />
            <select
              className={selectClass}
              value={newQuestionCategory}
              onChange={(event) =>
                setNewQuestionCategory(event.target.value as QuestionCategory)
              }
              aria-label="Question category"
            >
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex h-[42px] items-center gap-1.5 rounded-[9px] border border-[#8183ff] bg-white px-3.5 text-[13px] font-medium text-[#5255ed] transition hover:bg-[#f7f6ff]"
            >
              <Plus size={15} aria-hidden />
              Add
            </button>
            <button
              type="button"
              onClick={() => setBulkOpen((value) => !value)}
              className="inline-flex h-[42px] items-center rounded-[9px] border border-[#e2e5f0] bg-white px-3.5 text-[13px] font-medium text-[#59628c] transition hover:bg-[#fafaff]"
            >
              Bulk add
            </button>
          </div>

          {bulkOpen && (
            <div className="mt-3 rounded-[9px] border border-[#dddfff] bg-[#f8f7ff] p-4">
              <p className="m-0 mb-2 text-[13px] text-[#44496e]">
                One question per line. All lines use the selected category.
              </p>
              <textarea
                className={`${inputClass} min-h-[120px] resize-y`}
                value={bulkText}
                onChange={(event) => setBulkText(event.target.value)}
                placeholder={"Question one\nQuestion two\nQuestion three"}
              />
              <div className="mt-2 flex gap-2">
                <select
                  className={selectClass}
                  value={bulkCategory}
                  onChange={(event) =>
                    setBulkCategory(event.target.value as QuestionCategory)
                  }
                  aria-label="Bulk category"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addBulkQuestions}
                  className="inline-flex h-[42px] items-center rounded-[9px] bg-[image:var(--gradient-button)] px-4 text-[13px] font-medium text-white shadow-[var(--shadow-button)]"
                >
                  Add all
                </button>
              </div>
            </div>
          )}
        </Card>

        {error && (
          <div className="rounded-[10px] border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[#a6302d]">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          {!isNew ? (
            <button
              type="button"
              onClick={remove}
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-[9px] border border-[#ffd9d8] bg-white px-4 text-[13px] font-medium text-[#ba3633] transition hover:bg-[var(--danger-soft)] disabled:opacity-50"
            >
              <Trash size={15} aria-hidden />
              Delete job
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-10 items-center rounded-[9px] bg-[image:var(--gradient-button)] px-6 text-[13px] font-medium text-white shadow-[var(--shadow-button)] transition hover:shadow-[0_8px_18px_rgb(70_68_232/0.24)] disabled:opacity-60"
          >
            {saving ? "Saving..." : isNew ? "Create job" : "Save changes"}
          </button>
        </div>
      </main>
    </div>
  );
}
