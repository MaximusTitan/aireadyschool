import { createClient } from "@supabase/supabase-js";
import { Suspense } from "react";
import { UserCheck, UserX, Users } from "lucide-react";
import CollapsibleSection from "./collapsible-section";
import UserSearch from "./user-search";
import { PaginatedUsers } from "./paginated-users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ALLOWED_ROLES } from "./types";
import { SearchProvider } from "./search-context";

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

  if (error) throw new Error(`Error fetching users: ${error.message}`);

  const stats = {
    total: users.length,
    active: users.filter((u) => u.user_metadata?.status === "active").length,
    inactive: users.filter((u) => u.user_metadata?.status === "disabled")
      .length,
  };

  return (
    <SearchProvider>
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Role Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage user roles and permissions
            </p>
          </div>
          <UserSearch />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Inactive Users
              </CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inactive}</div>
            </CardContent>
          </Card>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <CollapsibleSection />
        </Suspense>

        <div className="bg-background rounded-lg shadow-sm border p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              User Directory
            </h2>
            <div className="flex flex-wrap gap-2">
              {ALLOWED_ROLES.map((role) => (
                <button
                  key={role}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-secondary hover:bg-secondary/80"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
          <Suspense fallback={<UsersTableSkeleton />}>
            <PaginatedUsers users={users} />
          </Suspense>
        </div>
      </div>
    </SearchProvider>
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
