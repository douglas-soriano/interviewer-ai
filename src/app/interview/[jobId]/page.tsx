import { notFound } from "next/navigation";
import { InterviewRoom } from "@/components/interview/InterviewRoom";
import { loadJobById } from "@/services/job/loadJobById";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  try {
    const job = await loadJobById(jobId);

    return (
      <InterviewRoom
        jobId={job.id}
        jobTitle={job.title}
        jobDescription={job.description}
        interviewerName={job.persona.name}
        skills={job.skills}
        questions={job.questions}
      />
    );
  } catch {
    notFound();
  }
}
