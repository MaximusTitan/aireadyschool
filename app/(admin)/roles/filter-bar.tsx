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
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";

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
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className={`flex flex-wrap gap-2 ${isMobile ? "flex-col" : ""}`}>
        <div className="flex flex-wrap gap-2">
          {hasRoles ? (
            <motion.div layout className="flex flex-wrap gap-2">
              {ALLOWED_ROLES.map((role) => (
                <motion.div
                  key={role}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                >
                  <Button
                    variant={
                      filters.roles.includes(role) ? "secondary" : "outline"
                    }
                    size="sm"
                    onClick={() => toggleRole(role)}
                    className={`rounded-full transition-all duration-200 ${
                      !validRoles.includes(role) ? "opacity-50" : ""
                    }`}
                    disabled={!validRoles.includes(role)}
                  >
                    {role}
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <span className="text-sm text-muted-foreground px-2">
              No roles available
            </span>
          )}
        </div>

        {!isMobile && <div className="h-6 w-px bg-border mx-2" />}

        <div className="flex flex-wrap gap-2">
          {hasStatuses ? (
            <motion.div layout className="flex flex-wrap gap-2">
              {USER_STATUSES.map((status) => (
                <motion.div
                  key={status}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                >
                  <Button
                    variant={
                      filters.status.includes(status) ? "secondary" : "outline"
                    }
                    size="sm"
                    onClick={() => toggleStatus(status)}
                    className={`rounded-full transition-all duration-200 ${
                      !validStatuses.includes(status) ? "opacity-50" : ""
                    }`}
                    disabled={!validStatuses.includes(status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <span className="text-sm text-muted-foreground px-2">
              No status options available
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {(filters.roles.length > 0 || filters.status.length > 0) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
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

            <div className="w-full mt-2 flex gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">
                Active filters:
              </span>
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
