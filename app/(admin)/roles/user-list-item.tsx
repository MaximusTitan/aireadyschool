"use client";

import { useState } from "react";
import { ALLOWED_ROLES, UserRole, USER_STATUSES } from "./types";
import { updateUserAction } from "./actions";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function UserListItem({
  user,
  credits,
}: {
  user: any;
  credits?: { image_credits: number | null; video_credits: number | null };
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [formData, setFormData] = useState({
    email: user.email,
    name: user.user_metadata?.name || "",
    role: user.user_metadata?.role || "Student",
    status: user.user_metadata?.status || "disabled",
    password: "",
    image_credits: credits?.image_credits ?? 0,
    video_credits: credits?.video_credits ?? 0,
  });

  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const result = await updateUserAction(user.id, {
        email: formData.email,
        name: formData.name,
        role: formData.role as UserRole,
        status: formData.status,
        password: formData.password || undefined,
        image_credits: formData.image_credits,
        video_credits: formData.video_credits,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "User updated successfully",
        });
        setStatus("success");
        setIsEditing(false);
        router.refresh(); // Add this line to trigger a client-side refresh
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update user",
          variant: "destructive",
        });
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      {isEditing ? (
        <form
          onSubmit={handleSubmit}
          className="bg-background border rounded-lg shadow p-6 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, role: e.target.value }))
                }
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {ALLOWED_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value }))
                }
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {USER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                New Password (leave empty to keep current)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Image Credits
              </label>
              <input
                type="number"
                value={formData.image_credits}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    image_credits: parseInt(e.target.value) || 0,
                  }))
                }
                min="0"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Video Credits
              </label>
              <input
                type="number"
                value={formData.video_credits}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    video_credits: parseInt(e.target.value) || 0,
                  }))
                }
                min="0"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {status === "loading" ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-background border rounded-lg p-4 hover:shadow-md transition-all duration-200 group">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <Tooltip>
                <TooltipTrigger>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-105">
                    <span className="text-lg font-semibold text-primary">
                      {user.user_metadata?.name?.[0] ||
                        user.email[0].toUpperCase()}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click to edit user details</p>
                </TooltipContent>
              </Tooltip>
              <div className="space-y-1">
                <h3 className="font-medium text-foreground">{user.email}</h3>
                <p className="text-sm text-muted-foreground">
                  {user.user_metadata?.name || "No name set"}
                </p>
                <div className="flex gap-2">
                  <RoleBadge role={user.user_metadata?.role || "Student"} />
                  <StatusBadge
                    status={user.user_metadata?.status || "disabled"}
                  />
                </div>
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  <span>
                    Image Credits: {credits?.image_credits ?? "Not set"}
                  </span>
                  <span>
                    Video Credits: {credits?.video_credits ?? "Not set"}
                  </span>
                </div>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-secondary rounded-full transition-colors"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Edit user</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors = {
    Admin: "bg-purple-100 text-purple-800",
    Teacher: "bg-blue-100 text-blue-800",
    School: "bg-orange-100 text-orange-800",
    Student: "bg-green-100 text-green-800",
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[role as keyof typeof colors]}`}
    >
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
        status === "active"
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function PencilIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </svg>
  );
}
