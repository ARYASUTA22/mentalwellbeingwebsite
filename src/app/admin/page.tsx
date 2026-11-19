import { getAdminDashboardData } from "@/actions/admin";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const data = await getAdminDashboardData();

  return (
    <AdminDashboardClient
      initialArticles={data.articles}
      initialVoiceEntries={data.voiceEntries}
      initialComfortPulses={data.comfortPulses}
    />
  );
}
