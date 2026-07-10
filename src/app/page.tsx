import { HomeDashboard } from "@/components/home/HomeDashboard";
import { mockHistory, mockJobs } from "@/mock/interviewData";

export default function Home() {
  return <HomeDashboard jobs={mockJobs} interviews={mockHistory} />;
}
