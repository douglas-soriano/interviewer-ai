import { SettingsList } from "@/components/settings/SettingsList";
import { listAdminJobs } from "@/services/job/listAdminJobs";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const jobs = await listAdminJobs();
  return <SettingsList jobs={jobs} />;
}
