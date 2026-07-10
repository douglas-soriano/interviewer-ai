import { notFound } from "next/navigation";
import {
  JobEditor,
  type JobEditorData,
} from "@/components/settings/JobEditor";
import { loadJobById } from "@/services/job/loadJobById";

export const dynamic = "force-dynamic";

const EMPTY_JOB: JobEditorData = {
  id: null,
  title: "",
  description: "",
  persona: { name: "", tone: "", focus: "" },
  skills: [],
  questions: [],
};

export default async function JobSettingsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  if (jobId === "new") {
    return <JobEditor initial={EMPTY_JOB} />;
  }

  try {
    const job = await loadJobById(jobId);
    return (
      <JobEditor
        initial={{
          id: job.id,
          title: job.title,
          description: job.description,
          persona: job.persona,
          skills: job.skills,
          questions: job.questions,
        }}
      />
    );
  } catch {
    notFound();
  }
}
