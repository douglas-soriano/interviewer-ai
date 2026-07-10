"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  CircleNotch,
  Microphone,
  MicrophoneSlash,
  WarningCircle,
} from "@phosphor-icons/react";
import type { BankQuestion, JobSkill } from "@/domain/interview";
import { useInterviewSession } from "@/hooks/useInterviewSession";
import { useMicPermission } from "@/hooks/useMicPermission";
import { InterviewChat } from "./InterviewChat";
import { InterviewHeader } from "./InterviewHeader";
import { InterviewSidebar } from "./InterviewSidebar";
import { RecordButton } from "./RecordButton";

const PREPARING_DELAY_MS = 650;

function Notice({
  tone,
  children,
}: {
  tone: "warning" | "danger";
  children: ReactNode;
}) {
  const className =
    tone === "danger"
      ? "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[#a6302d]"
      : "border-[#ffe0bd] bg-[var(--warning-soft)] text-[#9d570d]";

  return (
    <div className={`rounded-[12px] border px-4 py-3 text-sm leading-6 ${className}`}>
      {children}
    </div>
  );
}

function CenteredScreen({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto grid min-h-[calc(100dvh-var(--interview-header-height))] max-w-md place-items-center px-6 text-center">
      <div className="w-full">{children}</div>
    </main>
  );
}

function PreparingScreen({
  micGranted,
  sessionStarting,
}: {
  micGranted: boolean;
  sessionStarting: boolean;
}) {
  const steps = [
    { label: "Microphone access", done: micGranted, active: !micGranted },
    {
      label: "Preparing your first question",
      done: false,
      active: micGranted && sessionStarting,
    },
  ];

  return (
    <CenteredScreen>
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
        <Microphone size={24} aria-hidden />
      </div>
      <h1 className="mt-5 text-lg font-bold text-[var(--text-primary)]">
        Setting up your interview
      </h1>
      <ul
        className="mx-auto mt-6 flex max-w-[300px] flex-col gap-3 text-left"
        aria-live="polite"
      >
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-3 text-sm">
            {step.done ? (
              <CheckCircle
                size={20}
                weight="fill"
                className="shrink-0 text-[var(--success)]"
                aria-hidden
              />
            ) : step.active ? (
              <CircleNotch
                size={20}
                className="shrink-0 animate-spin text-[var(--primary)]"
                aria-hidden
              />
            ) : (
              <span
                className="h-5 w-5 shrink-0 rounded-full border-2 border-[var(--border-strong)]"
                aria-hidden
              />
            )}
            <span
              className={
                step.done || step.active
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-muted)]"
              }
            >
              {step.label}
            </span>
          </li>
        ))}
      </ul>
    </CenteredScreen>
  );
}

function MicDeniedScreen({
  onRetry,
  onLeave,
}: {
  onRetry: () => void;
  onLeave: () => void;
}) {
  return (
    <CenteredScreen>
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--danger-soft)] text-[#d83c39]">
        <MicrophoneSlash size={24} aria-hidden />
      </div>
      <h1 className="mt-5 text-lg font-bold text-[var(--text-primary)]">
        Microphone access is required
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        This voice interview cannot start without your microphone. Allow access
        in the browser and try again.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-[9px] bg-[image:var(--gradient-button)] px-5 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-button)]"
        >
          Allow microphone
        </button>
        <button
          type="button"
          onClick={onLeave}
          className="rounded-[9px] border border-[#e1e4ef] bg-white px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[#fafaff]"
        >
          Back to roles
        </button>
      </div>
    </CenteredScreen>
  );
}

function StartupErrorScreen({
  message,
  onLeave,
}: {
  message: string;
  onLeave: () => void;
}) {
  return (
    <CenteredScreen>
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--danger-soft)] text-[#d83c39]">
        <WarningCircle size={24} weight="fill" aria-hidden />
      </div>
      <h1 className="mt-5 text-lg font-bold text-[var(--text-primary)]">
        The interview could not start
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        {message}
      </p>
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onLeave}
          className="rounded-[9px] border border-[#e1e4ef] bg-white px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[#fafaff]"
        >
          Back to roles
        </button>
      </div>
    </CenteredScreen>
  );
}

export function InterviewRoom({
  jobId,
  jobTitle,
  jobDescription,
}: {
  jobId: string;
  jobTitle: string;
  jobDescription: string;
  interviewerName: string;
  skills: JobSkill[];
  questions: BankQuestion[];
}) {
  const router = useRouter();
  const mic = useMicPermission();
  const [prepared, setPrepared] = useState(false);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);
  const session = useInterviewSession(jobId, {
    enabled: mic.state === "granted" && prepared,
  });

  useEffect(() => {
    if (mic.state !== "granted") {
      setPrepared(false);
      return;
    }

    const timer = window.setTimeout(() => setPrepared(true), PREPARING_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [mic.state]);

  const leaveInterview = useCallback(() => {
    router.push("/");
  }, [router]);

  if (mic.state === "denied") {
    return (
      <div className="app-shell">
        <InterviewHeader
          jobTitle={jobTitle}
          analyticsVisible={analyticsVisible}
          onAnalyticsChange={setAnalyticsVisible}
        />
        <MicDeniedScreen onRetry={mic.retry} onLeave={leaveInterview} />
      </div>
    );
  }

  if (mic.state === "checking" || !prepared || session.phase === "starting") {
    return (
      <div className="app-shell">
        <InterviewHeader
          jobTitle={jobTitle}
          analyticsVisible={analyticsVisible}
          onAnalyticsChange={setAnalyticsVisible}
        />
        <PreparingScreen
          micGranted={mic.state === "granted"}
          sessionStarting={session.phase === "starting"}
        />
      </div>
    );
  }

  if (session.phase === "error") {
    return (
      <div className="app-shell">
        <InterviewHeader
          jobTitle={jobTitle}
          analyticsVisible={analyticsVisible}
          onAnalyticsChange={setAnalyticsVisible}
        />
        <StartupErrorScreen
          message={session.error ?? "Unexpected startup error."}
          onLeave={leaveInterview}
        />
      </div>
    );
  }

  const thinking = session.phase === "streaming";
  const thinkingText = session.streamingText || "Drafting the next prompt";
  const recordDisabled =
    session.phase !== "ready" ||
    session.turns.length === 0;

  return (
    <div className="app-shell">
      <InterviewHeader
        jobTitle={session.jobTitle || jobTitle}
        analyticsVisible={analyticsVisible}
        onAnalyticsChange={setAnalyticsVisible}
      />

      <div className="interview-layout">
        <div className="min-h-0 min-w-0">
          <InterviewChat
            turns={session.turns}
            interviewerName={session.interviewerName}
            jobTitle={session.jobTitle || jobTitle}
            jobDescription={session.jobDescription || jobDescription}
            analyticsVisible={analyticsVisible}
            thinking={thinking}
            thinkingText={thinkingText}
            audioByTurn={session.audioByTurn}
          />

          <div className="space-y-3 border-t border-[var(--border-soft)] bg-white px-5 py-3 min-[900px]:px-8">
            {session.captureNotice && (
              <Notice tone="warning">{session.captureNotice}</Notice>
            )}

            {session.submitError && (
              <Notice tone="danger">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>{session.submitError}</span>
                  {session.canRetrySubmit && (
                    <button
                      type="button"
                      onClick={() => void session.retrySubmit()}
                      className="rounded-[9px] border border-[var(--danger-border)] bg-white px-3 py-2 text-sm font-medium text-[#a6302d] transition hover:bg-[#fff7f7]"
                    >
                      Retry answer
                    </button>
                  )}
                </div>
              </Notice>
            )}

            {session.phase === "completed" && (
              <Notice tone="warning">
                This interview is complete. You can return to the roles list and
                review the session from the home screen.
              </Notice>
            )}
          </div>

          <RecordButton
            isRecording={session.isRecording}
            volumeOk={session.volumeOk}
            disabled={recordDisabled}
            level={session.level}
            secondsLeft={session.secondsLeft}
            timeLimit={session.timeLimit}
            transcript={session.liveTranscript}
            interim={session.interim}
            onStart={session.startRecording}
            onStop={session.stopAndSubmit}
          />
        </div>

        <InterviewSidebar
          analyticsVisible={analyticsVisible}
          panel={session.panel}
          jobDescription={session.jobDescription || jobDescription}
        />
      </div>
    </div>
  );
}
