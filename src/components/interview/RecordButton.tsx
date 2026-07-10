"use client";

import { Microphone, Stop } from "@phosphor-icons/react";
import { CountdownTimer } from "./CountdownTimer";
import { WaveformVisualizer } from "./WaveformVisualizer";

export function RecordButton({
  isRecording,
  volumeOk,
  disabled,
  level,
  secondsLeft,
  timeLimit,
  transcript,
  interim,
  onStart,
  onStop,
}: {
  isRecording: boolean;
  volumeOk: boolean;
  disabled: boolean;
  level: number;
  secondsLeft: number;
  timeLimit: number;
  transcript: string;
  interim: string;
  onStart: () => void | Promise<void>;
  onStop: () => void | Promise<void>;
}) {
  const liveText = `${transcript} ${interim}`.trim();

  const toggle = () => {
    if (isRecording) {
      void onStop();
      return;
    }

    if (!disabled) {
      void onStart();
    }
  };

  return (
    <section className="border-t border-[var(--border-soft)] bg-white px-5 py-4 min-[900px]:px-8">
      <div className="mx-auto flex max-w-[920px] items-center gap-4 rounded-[24px] border border-[#e0e2ef] bg-[#fbfbff] p-3 shadow-[0_8px_28px_rgb(26_30_86/0.07)]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <WaveformVisualizer level={level} active={isRecording} />
            <div className="min-w-0 flex-1">
              <div
                aria-live="polite"
                className="relative flex h-6 items-center overflow-hidden"
              >
                {isRecording && liveText && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-[linear-gradient(to_right,#fbfbff,transparent)]"
                  />
                )}
                <p className="m-0 ml-auto whitespace-nowrap text-sm leading-6 text-[var(--text-secondary)]">
                  {isRecording
                    ? liveText || "Listening. Speak naturally, then press stop."
                    : disabled
                      ? "Waiting for the interviewer."
                      : "Tap the microphone to answer."}
                </p>
              </div>
              <div
                className="mt-2 flex items-center gap-2 text-xs"
                aria-live="polite"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isRecording
                      ? volumeOk
                        ? "bg-[var(--success)]"
                        : "bg-[var(--warning)]"
                      : "bg-[#cfd2e2]"
                  }`}
                  aria-hidden
                />
                <span
                  className={
                    isRecording && !volumeOk
                      ? "text-[#9d570d]"
                      : "text-[var(--text-muted)]"
                  }
                >
                  {isRecording
                    ? volumeOk
                      ? "Audio detected"
                      : "Listening for speech"
                    : "Tap to start, tap again to submit"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {isRecording && (
          <div className="hidden min-[760px]:block">
            <CountdownTimer secondsLeft={secondsLeft} total={timeLimit} />
          </div>
        )}

        <button
          type="button"
          disabled={disabled && !isRecording}
          onClick={toggle}
          aria-pressed={isRecording}
          aria-label={
            isRecording ? "Stop and submit answer" : "Start recording answer"
          }
          className={`relative grid h-[64px] w-[64px] shrink-0 place-items-center rounded-full text-white shadow-[var(--shadow-mic)] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 ${
            isRecording ? "bg-[#f04b48]" : "bg-[image:var(--gradient-mic)]"
          }`}
        >
          {isRecording && (
            <span
              aria-hidden
              className="absolute inset-[-7px] animate-ping rounded-full bg-[#f04b48]/20"
            />
          )}
          {isRecording ? (
            <Stop size={26} weight="fill" aria-hidden />
          ) : (
            <Microphone size={27} weight="fill" aria-hidden />
          )}
        </button>
      </div>
    </section>
  );
}
