import { Microphone } from "@phosphor-icons/react";

const bars = [0.18, 0.42, 0.28, 0.64, 0.36, 0.74, 0.48, 0.32, 0.56, 0.22];

export function RecordControl() {
  return (
    <section className="border-t border-[var(--border-soft)] bg-white px-5 py-4 min-[900px]:px-8">
      <div className="mx-auto flex max-w-[920px] items-center gap-4 rounded-[24px] border border-[#e0e2ef] bg-[#fbfbff] p-3 shadow-[0_8px_28px_rgb(26_30_86/0.07)]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 min-w-[150px] items-center justify-center gap-[3px] rounded-[10px] border border-[var(--border)] bg-white px-3"
              role="img"
              aria-label="Placeholder audio waveform"
            >
              {bars.map((value, index) => (
                <span
                  key={index}
                  className="w-[3px] rounded-full bg-[var(--primary)] opacity-70"
                  style={{ height: `${Math.round(value * 100)}%` }}
                />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-sm leading-6 text-[var(--text-secondary)]">
                Tap the microphone to answer. Voice capture arrives in the next phase.
              </p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Static control, no microphone access requested.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled
          aria-label="Recording unavailable in this static shell"
          className="relative grid h-[64px] w-[64px] shrink-0 place-items-center rounded-full bg-[image:var(--gradient-mic)] text-white opacity-80 shadow-[var(--shadow-mic)]"
        >
          <Microphone size={27} weight="fill" aria-hidden />
        </button>
      </div>
    </section>
  );
}
