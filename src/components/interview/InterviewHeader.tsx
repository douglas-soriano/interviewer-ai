import { ArrowLeft } from "@phosphor-icons/react";
import { AnalyticsToggle } from "./AnalyticsToggle";

export function InterviewHeader({
  jobTitle,
  phase,
  analyticsVisible,
  onAnalyticsChange,
  onLeave,
}: {
  jobTitle: string;
  phase: string;
  analyticsVisible: boolean;
  onAnalyticsChange: (enabled: boolean) => void;
  onLeave: () => void;
}) {
  const liveLabel =
    phase === "recording"
      ? "Recording"
      : phase === "streaming"
        ? "Interviewer typing"
        : phase === "starting"
          ? "Starting"
          : "Live";

  return (
    <header className="flex h-[var(--interview-header-height)] items-center gap-3 border-b border-[#e8eaf2] bg-white px-4 min-[900px]:px-[31px]">
      <button
        type="button"
        onClick={onLeave}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-[#e1e4ef] bg-white text-[var(--text-secondary)] transition hover:border-[#d5d8e9] hover:bg-[#fafaff]"
        aria-label="Leave interview and return to roles"
      >
        <ArrowLeft size={18} aria-hidden />
      </button>

      <div className="min-w-0">
        <p className="m-0 truncate text-[14px] font-semibold leading-5 text-[var(--text-primary)]">
          {jobTitle || "Preparing interview"}
        </p>
        <p className="m-0 text-[11px] leading-4 text-[var(--text-muted)]">
          Interview room
        </p>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 min-[560px]:gap-3">
        <span
          className={`inline-flex h-9 items-center gap-2 rounded-[10px] border px-3 text-xs font-medium ${
            phase === "recording"
              ? "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[#ba3633]"
              : "border-[#dff1e8] bg-[var(--success-soft)] text-[#158b59]"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              phase === "recording"
                ? "animate-pulse bg-[var(--danger)] motion-reduce:animate-none"
                : "bg-[var(--success)]"
            }`}
            aria-hidden
          />
          <span className="hidden sm:inline">{liveLabel}</span>
        </span>
        <AnalyticsToggle enabled={analyticsVisible} onChange={onAnalyticsChange} />
      </div>
    </header>
  );
}
