const foundationItems = [
  {
    label: "Application",
    value: "Next.js App Router with TypeScript",
  },
  {
    label: "Interface",
    value: "Tailwind CSS foundation and responsive shell",
  },
  {
    label: "Data",
    value: "Local Postgres wiring ready for the domain model",
  },
];

export default function Home() {
  return (
    <main className="min-h-[100dvh] px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between border-b border-[color:var(--panel-border)] py-5">
          <a className="text-base font-semibold" href="/">
            Interviewer AI
          </a>
          <span className="text-sm text-[color:var(--muted)]">Foundation</span>
        </header>

        <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div className="max-w-3xl">
            <p className="mb-5 text-sm font-medium text-[color:var(--accent)]">
              Voice-led interview platform
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
              A clean base for adaptive interview sessions.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[color:var(--muted)]">
              The project shell is ready for job selection, interview flow, and
              auditable results as the product layers are added.
            </p>
          </div>

          <div
            aria-label="Foundation status"
            className="rounded-lg border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-5 shadow-[0_24px_70px_rgba(18,24,20,0.08)]"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Ready checks</h2>
              <span className="text-sm font-medium text-[color:var(--accent)]">
                Phase base
              </span>
            </div>
            <dl className="divide-y divide-[color:var(--panel-border)]">
              {foundationItems.map((item) => (
                <div className="grid gap-1 py-4" key={item.label}>
                  <dt className="text-sm font-medium">{item.label}</dt>
                  <dd className="text-sm leading-6 text-[color:var(--muted)]">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>
    </main>
  );
}
