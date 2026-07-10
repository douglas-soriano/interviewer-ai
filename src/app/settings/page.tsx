import { SettingsList } from "@/components/settings/SettingsList";
import { mockJobs } from "@/mock/interviewData";

export default function SettingsPage() {
  return <SettingsList jobs={mockJobs} />;
}
