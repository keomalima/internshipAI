
import Dashboard from "@/components/Dashboard";
import { getApplications } from "@/actions/applications";

export default async function Home() {
  const applications = await getApplications();

  return (
    <main className="min-h-screen bg-background">
      <Dashboard initialApplications={applications} />
    </main>
  );
}
