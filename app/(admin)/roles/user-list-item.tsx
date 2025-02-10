"use client";

import { useState } from "react";
import { ALLOWED_ROLES, UserRole, USER_STATUSES } from "./types";
import { updateUserAction } from "./actions";

export default function UserListItem({ user }: { user: any }) {
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    const result = await updateUserAction(user.id, {
      email: formData.email,
      name: formData.name,
      role: formData.role as UserRole,
      status: formData.status,
      password: formData.password || undefined,
    });

    if (result.success) {
      setStatus("success");
      setIsEditing(false);
    } else {
      setStatus("error");
    }
  };

  return isEditing ? (
    <>
      <form
        onSubmit={handleSubmit}
        className="bg-background border rounded-lg shadow-sm p-6 space-y-4"
      >
        <div>
          <label className="block mb-1 text-foreground">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            className="w-full border rounded p-2 bg-background text-foreground"
          />
        </div>

        <div>
          <label className="block mb-1 text-foreground">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full border rounded p-2 bg-background text-foreground"
          />
        </div>

        <div>
          <label className="block mb-1 text-foreground">Role</label>
          <select
            value={formData.role}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, role: e.target.value }))
            }
            className="w-full border rounded p-2 bg-background text-foreground"
          >
            {ALLOWED_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-foreground">Status</label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, status: e.target.value }))
            }
            className="w-full border rounded p-2 bg-background text-foreground"
          >
            {USER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-foreground">
            New Password (leave empty to keep current)
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, password: e.target.value }))
            }
            className="w-full border rounded p-2 bg-background text-foreground"
          />
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <button
            type="submit"
            disabled={status === "loading"}
            className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:bg-primary/50"
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="flex-1 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium mb-4">Confirm Changes</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to save these changes?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                }}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  ) : (
    <div className="bg-background border rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="font-medium text-foreground">{user.email}</h3>
          <p className="text-sm text-muted-foreground">
            Name: {user.user_metadata?.name || "N/A"}
          </p>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user.user_metadata?.role === "Admin"
                ? "bg-purple-100 text-purple-800"
                : user.user_metadata?.role === "Teacher"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
            }`}
          >
            {user.user_metadata?.role || "Student"}
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user.user_metadata?.status === "active"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            } ml-2`}
          >
            {(user.user_metadata?.status || "disabled")
              .charAt(0)
              .toUpperCase() +
              (user.user_metadata?.status || "disabled").slice(1)}
          </span>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <span className="sr-only">Edit</span>
          <PencilIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
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
