import Link from "next/link";
import {
  ArrowRight,
  ChartBar,
  ChatsCircle,
  Code,
  GearSix,
  Headset,
  MagicWand,
  Microphone,
  PencilRuler,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import type { InterviewHistoryItem, PublicJob } from "@/domain/session";

const roleVisualBySlug = {
  "backend-engineer": {
    icon: Code,
    gradient:
      "bg-[linear-gradient(145deg,#a69cff_0%,#7669ff_42%,#4c49f4_100%)] shadow-[0_10px_20px_rgb(85_73_238/0.21)]",
  },
  "product-designer": {
    icon: PencilRuler,
    gradient:
      "bg-[linear-gradient(145deg,#91e7c2_0%,#50d99e_42%,#11c576_100%)] shadow-[0_10px_20px_rgb(18_190_115/0.16)]",
  },
  "data-analyst": {
    icon: ChartBar,
    gradient:
      "bg-[linear-gradient(145deg,#83b3ff_0%,#4b8cec_45%,#2368db_100%)] shadow-[0_10px_20px_rgb(40_105_217/0.17)]",
  },
};

function RoleCard({ job }: { job: PublicJob }) {
  const visual = roleVisualBySlug[job.slug as keyof typeof roleVisualBySlug] ?? {
    icon: Headset,
    gradient:
      "bg-[linear-gradient(145deg,#ffc982_0%,#ffa14c_45%,#ff7e27_100%)] shadow-[0_10px_20px_rgb(245_126_35/0.15)]",
  };
  const Icon = visual.icon;

  return (
    <Link
      href="/interview/mock"
      className="group grid gap-4 rounded-[14px] border border-[var(--border)] bg-white px-5 py-5 shadow-[0_2px_8px_rgb(24_28_78/0.018)] transition hover:-translate-y-0.5 hover:border-[#cacdef] hover:shadow-[0_10px_26px_rgb(27_31_87/0.07)] sm:grid-cols-[58px_1fr_auto] sm:items-center sm:px-6"
    >
      <div
        className={`grid h-[58px] w-[58px] shrink-0 place-items-center rounded-[18px] text-white ${visual.gradient}`}
      >
        <Icon size={28} aria-hidden />
      </div>

      <div className="min-w-0">
        <h3 className="m-0 text-[17px] font-bold leading-6 tracking-[-0.25px] text-[#0c0e37]">
          {job.title}
        </h3>
        <p className="m-0 mt-1.5 text-[13px] leading-5 text-[#59628c]">
          {job.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.essentialSkills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center rounded-[6px] border border-[#e0e2f1] bg-[#f8f8ff] px-2 py-0.5 text-[11px] font-medium text-[#5559c6]"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <span className="inline-flex h-10 w-fit items-center gap-2 rounded-[9px] bg-[image:var(--gradient-button)] px-4 text-[13px] font-medium text-white shadow-[var(--shadow-button)] transition group-hover:shadow-[0_8px_18px_rgb(70_68_232/0.24)]">
        Start
        <ArrowRight size={15} aria-hidden />
      </span>
    </Link>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Microphone,
      title: "Answer by voice",
      copy: "One spontaneous spoken answer per question.",
    },
    {
      icon: MagicWand,
      title: "Adaptive follow-ups",
      copy: "The interviewer probes based on your answer.",
    },
    {
      icon: ChatsCircle,
      title: "Clear evaluation",
      copy: "See the transcript and structured result.",
    },
  ] as const;

  return (
    <section
      aria-label="How it works"
      className="grid gap-4 min-[760px]:grid-cols-3"
    >
      {steps.map(({ icon: Icon, title, copy }) => (
        <div key={title} className="flex items-start gap-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
            <Icon size={21} aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-semibold leading-5 text-[#15173d]">
              {title}
            </span>
            <span className="mt-1 block text-xs leading-5 text-[#59628a]">
              {copy}
            </span>
          </span>
        </div>
      ))}
    </section>
  );
}

function RecentSessions({ interviews }: { interviews: InterviewHistoryItem[] }) {
  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <section aria-label="Past interviews">
      <h2 className="m-0 text-[15px] font-bold leading-6 tracking-[-0.2px] text-[#0e1038]">
        Past interviews
      </h2>
      <div className="mt-3 overflow-hidden rounded-[13px] border border-[var(--border)] bg-white shadow-[var(--shadow-card)]">
        {interviews.map((item) => (
          <Link
            key={item.id}
            href="/results/mock"
            className="grid gap-3 border-b border-[var(--border-soft)] px-5 py-4 transition last:border-b-0 hover:bg-[#fafaff] sm:grid-cols-[1fr_auto_auto] sm:items-center"
          >
            <div className="min-w-0">
              <p className="m-0 truncate text-[13px] font-semibold leading-5 text-[#22284f]">
                {item.jobTitle}
              </p>
              <p className="m-0 mt-0.5 text-[11px] leading-4 text-[#7e85a7]">
                {formatter.format(item.createdAt)}, {item.answeredQuestions} answers
              </p>
            </div>
            <span className="inline-flex h-[26px] w-fit items-center rounded-[6px] bg-[var(--success-soft)] px-2.5 text-[11px] font-semibold text-[#12a86a]">
              Score {item.overallScore}
            </span>
            <ArrowRight size={15} className="hidden text-[#9aa0c2] sm:block" aria-hidden />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function HomeDashboard({
  jobs,
  interviews,
}: {
  jobs: PublicJob[];
  interviews: InterviewHistoryItem[];
}) {
  return (
    <div className="app-shell">
      <main className="mx-auto flex max-w-[900px] flex-col gap-10 px-5 pb-16 pt-10 sm:px-6 sm:pt-14">
        <header>
          <div className="flex items-center gap-2.5">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] bg-[image:var(--gradient-primary)] text-white shadow-[0_8px_18px_rgb(82_76_245/0.18)]">
              <Sparkle size={18} weight="bold" aria-hidden />
            </span>
            <span className="text-[17px] font-bold leading-6 tracking-[-0.4px] text-[var(--text-primary)]">
              Interviewer AI
            </span>
            <Link
              href="/settings"
              aria-label="Job settings"
              className="ml-auto grid h-9 w-9 place-items-center rounded-[9px] border border-[#e1e4ef] bg-white text-[var(--text-secondary)] transition hover:border-[#d5d8e9] hover:bg-[#fafaff]"
            >
              <GearSix size={17} aria-hidden />
            </Link>
          </div>
          <h1 className="m-0 mt-7 max-w-[680px] text-[34px] font-bold leading-[42px] tracking-[-1.1px] text-[#080a31] sm:text-[40px] sm:leading-[48px]">
            Choose a role. Interview with an AI that listens.
          </h1>
          <p className="m-0 mt-3 max-w-[560px] text-[15px] leading-6 text-[#59628c]">
            A voice-led interview that adapts to your answers and shows how you
            are evaluated.
          </p>
        </header>

        <HowItWorks />

        <section className="flex flex-col gap-3" aria-label="Available roles">
          {jobs.map((job) => (
            <RoleCard key={job.id} job={job} />
          ))}
        </section>

        <RecentSessions interviews={interviews} />
      </main>
    </div>
  );
}
