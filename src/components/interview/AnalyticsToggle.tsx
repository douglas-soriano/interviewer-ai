"use client";

export function AnalyticsToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className="inline-flex h-10 items-center gap-3 rounded-[10px] border border-[#dedffa] bg-white px-3 text-[13px] font-medium text-[var(--text-primary)] transition hover:border-[#cfd1fb] hover:bg-[#f8f7ff]"
    >
      <span>Analytics</span>
      <span
        className={`flex h-[22px] w-[40px] items-center rounded-full p-[3px] transition ${
          enabled ? "bg-[var(--primary)]" : "bg-[#d6d9e8]"
        }`}
        aria-hidden
      >
        <span
          className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            enabled ? "translate-x-[18px]" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
