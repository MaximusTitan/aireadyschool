"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ALLOWED_ROLES,
  USER_STATUSES,
  UserRole,
  UserStatus,
  Filters,
  DEFAULT_FILTERS,
} from "./types";
import { useSearch } from "./search-context";
import { X } from "lucide-react";
import { useCallback } from "react";

export function FilterBar({
  availableRoles = [],
  availableStatuses = [],
}: {
  availableRoles: string[];
  availableStatuses: string[];
}) {
  const { filters, setFilters } = useSearch();

  const validRoles = Array.isArray(availableRoles) ? availableRoles : [];
  const validStatuses = Array.isArray(availableStatuses)
    ? availableStatuses
    : [];

  const toggleRole = useCallback(
    (role: UserRole) => {
      setFilters((prev) => {
        const newRoles = prev.roles.includes(role)
          ? prev.roles.filter((r) => r !== role)
          : [...prev.roles, role];
        return { ...prev, roles: newRoles };
      });
    },
    [setFilters]
  );

  const toggleStatus = useCallback(
    (status: UserStatus) => {
      setFilters((prev) => {
        const newStatus = prev.status.includes(status)
          ? prev.status.filter((s) => s !== status)
          : [...prev.status, status];
        return { ...prev, status: newStatus };
      });
    },
    [setFilters]
  );

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const hasRoles = validRoles.length > 0;
  const hasStatuses = validStatuses.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="flex flex-wrap gap-2">
        {hasRoles ? (
          ALLOWED_ROLES.map((role) => (
            <Button
              key={role}
              variant={filters.roles.includes(role) ? "secondary" : "outline"}
              size="sm"
              onClick={() => toggleRole(role)}
              className="rounded-full"
              disabled={!validRoles.includes(role)}
            >
              {role}
            </Button>
          ))
        ) : (
          <span className="text-sm text-muted-foreground px-2">
            No roles available
          </span>
        )}
      </div>

      <div className="h-6 w-px bg-border mx-2" />

      <div className="flex flex-wrap gap-2">
        {hasStatuses ? (
          USER_STATUSES.map((status) => (
            <Button
              key={status}
              variant={
                filters.status.includes(status) ? "secondary" : "outline"
              }
              size="sm"
              onClick={() => toggleStatus(status)}
              className="rounded-full"
              disabled={!validStatuses.includes(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))
        ) : (
          <span className="text-sm text-muted-foreground px-2">
            No status options available
          </span>
        )}
      </div>

      {(filters.roles.length > 0 || filters.status.length > 0) && (
        <>
          <div className="h-6 w-px bg-border mx-2" />
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        </>
      )}

      {(filters.roles.length > 0 || filters.status.length > 0) && (
        <div className="w-full mt-2 flex gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.roles.map((role) => (
            <Badge key={role} variant="secondary" className="px-2 py-0.5">
              {role}
              <button
                onClick={() => toggleRole(role)}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
          {filters.status.map((status) => (
            <Badge key={status} variant="secondary" className="px-2 py-0.5">
              {status}
              <button
                onClick={() => toggleStatus(status)}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
