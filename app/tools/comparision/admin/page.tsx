import { AdminTools } from "../components/admin-tools";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-backgroundApp p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold tracking-tight">
          Admin Dashboard
        </h1>
        <AdminTools />
      </div>
    </main>
  );
}
