function formatSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function CountdownTimer({
  secondsLeft,
  total,
}: {
  secondsLeft: number;
  total: number;
}) {
  const low = secondsLeft <= 15;

  return (
    <div className="min-w-[150px]" aria-live="polite">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-[var(--text-muted)]">Time left</span>
        <span
          className={`font-semibold tabular-nums ${
            low ? "text-[#d83c39]" : "text-[var(--text-primary)]"
          }`}
        >
          {formatSeconds(secondsLeft)}
        </span>
      </div>
      <progress
        value={secondsLeft}
        max={total}
        className={`h-2 w-full overflow-hidden rounded-full bg-[var(--meter-empty)] ${
          low ? "accent-[#ff4d4a]" : "accent-[var(--primary)]"
        }`}
        aria-label={`${secondsLeft} seconds remaining`}
      />
    </div>
  );
}
