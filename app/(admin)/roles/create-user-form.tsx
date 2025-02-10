"use client";

import { useState } from "react";
import { createUserAction } from "./actions";
import { ALLOWED_ROLES, UserRole, USER_STATUSES, UserStatus } from "./types";

export default function CreateUserForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "Student" as UserRole,
    autoVerify: true,
    status: "disabled" as UserStatus,
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    const result = await createUserAction(formData);

    if (result.success) {
      setStatus("success");
      setFormData({
        email: "",
        password: "",
        name: "",
        role: "Student" as UserRole,
        autoVerify: true,
        status: "disabled" as UserStatus,
      });
    } else {
      setStatus("error");
      setErrorMessage(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1 text-foreground">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          className="w-full border rounded p-2 bg-background text-foreground"
          required
        />
      </div>
      <div>
        <label className="block mb-1 text-foreground">Password</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, password: e.target.value }))
          }
          className="w-full border rounded p-2 bg-background text-foreground"
          required
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
            setFormData((prev) => ({
              ...prev,
              role: e.target.value as UserRole,
            }))
          }
          className="w-full border rounded p-2 bg-background text-foreground"
          required
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
            setFormData((prev) => ({
              ...prev,
              status: e.target.value as UserStatus,
            }))
          }
          className="w-full border rounded p-2 bg-background text-foreground"
          required
        >
          {USER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="flex items-center gap-2 text-foreground">
          <input
            type="checkbox"
            checked={formData.autoVerify}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, autoVerify: e.target.checked }))
            }
          />
          Auto-verify email
        </label>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-primary text-primary-foreground p-2 rounded hover:bg-primary/90 disabled:bg-primary/50"
      >
        {status === "loading" ? "Creating..." : "Create User"}
      </button>

      {status === "success" && (
        <p className="text-green-600 dark:text-green-400">
          User created successfully!
        </p>
      )}

      {status === "error" && (
        <p className="text-red-600 dark:text-red-400">{errorMessage}</p>
      )}
    </form>
  );
}
