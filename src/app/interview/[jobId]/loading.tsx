export default function InterviewLoading() {
  return (
    <div className="app-shell">
      <header className="flex h-[var(--interview-header-height)] items-center gap-3 border-b border-[#e8eaf2] bg-white px-4 min-[900px]:px-[31px]">
        <div className="h-10 w-10 animate-pulse rounded-[10px] bg-[var(--primary-soft)]" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-44 animate-pulse rounded bg-[var(--primary-soft)]" />
          <div className="h-2.5 w-24 animate-pulse rounded bg-[#f0f1f8]" />
        </div>
      </header>
      <main className="mx-auto max-w-[760px] space-y-5 px-6 py-10">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 animate-pulse rounded-full bg-[var(--primary-soft)]" />
          <div className="h-20 w-3/4 animate-pulse rounded-[18px] rounded-tl-[5px] bg-white shadow-[var(--shadow-card)]" />
        </div>
        <div className="flex justify-end gap-3">
          <div className="h-14 w-2/3 animate-pulse rounded-[18px] rounded-tr-[5px] bg-[#f4f4fd]" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-[#eef0f3]" />
        </div>
        <p className="pt-4 text-center text-sm font-medium text-[var(--text-secondary)]">
          Opening the interview room...
        </p>
      </main>
    </div>
  );
}
