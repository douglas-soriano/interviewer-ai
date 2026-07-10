"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import { AnalyticsToggle } from "./AnalyticsToggle";

export function InterviewHeader({
  jobTitle,
  analyticsVisible,
  onAnalyticsChange,
}: {
  jobTitle: string;
  analyticsVisible: boolean;
  onAnalyticsChange: (enabled: boolean) => void;
}) {
  return (
    <header className="flex h-[var(--interview-header-height)] items-center gap-3 border-b border-[#e8eaf2] bg-white px-4 min-[900px]:px-[31px]">
      <Link
        href="/"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-[#e1e4ef] bg-white text-[var(--text-secondary)] transition hover:border-[#d5d8e9] hover:bg-[#fafaff]"
        aria-label="Return to roles"
      >
        <ArrowLeft size={18} aria-hidden />
      </Link>

      <div className="min-w-0">
        <p className="m-0 truncate text-[14px] font-semibold leading-5 text-[var(--text-primary)]">
          {jobTitle}
        </p>
        <p className="m-0 text-[11px] leading-4 text-[var(--text-muted)]">
          Interview room
        </p>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 min-[560px]:gap-3">
        <span className="hidden h-9 items-center gap-2 rounded-[10px] border border-[#dff1e8] bg-[var(--success-soft)] px-3 text-xs font-medium text-[#158b59] sm:inline-flex">
          <span className="h-2 w-2 rounded-full bg-[var(--success)]" aria-hidden />
          Mock session
        </span>
        <AnalyticsToggle enabled={analyticsVisible} onChange={onAnalyticsChange} />
      </div>
    </header>
  );
}
