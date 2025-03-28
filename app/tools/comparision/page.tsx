import { Suspense } from "react";
import { StudentProgressDashboard } from "./components/student-progress-dashboard";
import { getAllStudentsProgressData } from "./actions";
import { LoadingDashboard } from "./components/loading-dashboard";

export default async function Home() {
  return (
    <main className="min-h-screen bg-backgroundApp p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold tracking-tight">
          Student Assessment Progress
        </h1>
        <Suspense fallback={<LoadingDashboard />}>
          <DashboardContainer />
        </Suspense>
      </div>
    </main>
  );
}

async function DashboardContainer() {
  const studentsData = await getAllStudentsProgressData();
  return <StudentProgressDashboard studentsData={studentsData} />;
}
