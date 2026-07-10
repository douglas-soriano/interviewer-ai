import {
  Microphone,
  ShieldCheck,
  Timer,
} from "@phosphor-icons/react";
import type { DecisionPanel as Panel } from "@/domain/interview";
import { INTERVIEW_POLICY } from "@/domain/interviewPolicy";
import { DecisionPanel } from "./DecisionPanel";

function SidebarCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[12px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-[15px] font-bold leading-5 text-[var(--text-primary)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatusRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Microphone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[var(--primary-soft)] text-[var(--primary)]">
        <Icon size={18} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-[var(--text-primary)]">
          {label}
        </span>
        <span className="block text-[11px] leading-5 text-[var(--text-muted)]">
          {value}
        </span>
      </span>
    </div>
  );
}

export function InterviewSidebar({
  analyticsVisible,
  panel,
  jobDescription,
}: {
  analyticsVisible: boolean;
  panel: Panel | null;
  jobDescription: string;
}) {
  return (
    <aside className="soft-scrollbar flex h-full max-h-[calc(100dvh-var(--interview-header-height))] flex-col gap-5 overflow-y-auto border-l border-[var(--border-soft)] bg-[var(--sidebar-bg)] p-5">
      {analyticsVisible ? (
        panel ? (
          <DecisionPanel panel={panel} />
        ) : (
          <SidebarCard title="Interview progress">
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              Analytics will appear after the first answer is processed.
            </p>
          </SidebarCard>
        )
      ) : (
        <>
          <SidebarCard title="Interview brief">
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              {jobDescription}
            </p>
            <div className="mt-4 space-y-3">
              <StatusRow
                icon={Microphone}
                label="One take per question"
                value="Your first spontaneous answer is the one that counts"
              />
              <StatusRow
                icon={Timer}
                label={`${INTERVIEW_POLICY.ANSWER_TIME_LIMIT_SEC} seconds per answer`}
                value="Recording submits when time runs out"
              />
              <StatusRow
                icon={ShieldCheck}
                label="Transparent scoring"
                value="Toggle Analytics to watch the interview reasoning live"
              />
            </div>
          </SidebarCard>

          <SidebarCard title="How this works">
            <div className="mt-4 space-y-4">
              {[
                ["Read the question", "Take a moment before recording."],
                ["Tap the microphone", "Speak naturally; tap again to submit."],
                ["Wait for follow-up", "The interviewer types the next prompt live."],
              ].map(([title, copy], index) => (
                <div key={title} className="grid grid-cols-[28px_1fr] gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--primary-soft)] text-xs font-bold text-[var(--primary)]">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[var(--text-primary)]">
                      {title}
                    </span>
                    <span className="block text-xs leading-5 text-[var(--text-secondary)]">
                      {copy}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </SidebarCard>
        </>
      )}
    </aside>
  );
}
