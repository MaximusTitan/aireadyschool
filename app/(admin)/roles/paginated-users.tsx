"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearch } from "./search-context";
import UserListItem from "./user-list-item";
import { UserRole, UserStatus } from "./types";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

export function PaginatedUsers({ users }: { users: any[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const { search, filters } = useSearch();

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchLower = search.toLowerCase();
      const email = user.email.toLowerCase();
      const name = (user.user_metadata?.name || "").toLowerCase();
      const role = user.user_metadata?.role || "";
      const status = user.user_metadata?.status || "";

      const matchesSearch =
        email.includes(searchLower) ||
        name.includes(searchLower) ||
        role.toLowerCase().includes(searchLower);

      const matchesRole =
        filters.roles.length === 0 || filters.roles.includes(role as UserRole);

      const matchesStatus =
        filters.status.length === 0 ||
        filters.status.includes(status as UserStatus);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, filters]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  );

  // Use useEffect to handle page reset
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters.roles, filters.status]);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (filteredUsers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No users found matching your search criteria.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {paginatedUsers.map((user) => (
          <UserListItem key={user.id} user={user} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-disabled={currentPage === 1}
              />
            </PaginationItem>

            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  onClick={() => setCurrentPage(i + 1)}
                  isActive={currentPage === i + 1}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                aria-disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
