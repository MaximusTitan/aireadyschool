import { createClient } from "@supabase/supabase-js";
import { Suspense } from "react";
import CollapsibleSection from "./collapsible-section";
import UserListItem from "./user-list-item";
import UserSearch from "./user-search";
import { PaginatedUsers } from "./paginated-users";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default async function RolesPage() {
  const {
    data: { users },
    error,
  } = await supabase.auth.admin.listUsers();

  if (error) {
    throw new Error(`Error fetching users: ${error.message}`);
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage user accounts
        </p>
      </div>

      <div className="space-y-6">
        <Suspense fallback={<div>Loading...</div>}>
          <CollapsibleSection />
        </Suspense>

        <div className="bg-background rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Existing Users
            </h2>
            <UserSearch />
          </div>
          <Suspense fallback={<UsersTableSkeleton />}>
            <PaginatedUsers users={users} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function UsersTableSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border p-4 rounded bg-muted">
          <div className="h-4 bg-muted-foreground/15 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-muted-foreground/15 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );
}
