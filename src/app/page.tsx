import { HomeDashboard } from "@/components/home/HomeDashboard";
import { listSessionHistory } from "@/services/interview/listSessionHistory";
import { listJobs } from "@/services/job/listJobs";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [jobs, interviews] = await Promise.all([
    listJobs(),
    listSessionHistory(),
  ]);

  return <HomeDashboard jobs={jobs} interviews={interviews} />;
}
