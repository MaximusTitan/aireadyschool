"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createUserAction } from "./actions";
import { ALLOWED_ROLES, UserRole, USER_STATUSES, UserStatus } from "./types";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(ALLOWED_ROLES as unknown as [string, ...string[]]),
  status: z.enum(USER_STATUSES as unknown as [string, ...string[]]),
  autoVerify: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateUserForm() {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "Student" as UserRole,
      status: "disabled" as UserStatus,
      autoVerify: true,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await createUserAction({
        ...data,
        role: data.role as UserRole,
        status: data.status as UserStatus,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "User created successfully",
        });
        reset();
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email</label>
          <input
            {...register("email")}
            type="email"
            className={`w-full rounded-md border p-2 ${
              errors.email ? "border-destructive" : "border-input"
            }`}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Password
          </label>
          <input
            {...register("password")}
            type="password"
            className={`w-full rounded-md border p-2 ${
              errors.password ? "border-destructive" : "border-input"
            }`}
          />
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Name</label>
          <input
            {...register("name")}
            type="text"
            className={`w-full rounded-md border p-2 ${
              errors.name ? "border-destructive" : "border-input"
            }`}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Role</label>
          <select
            {...register("role")}
            className={`w-full rounded-md border p-2 ${
              errors.role ? "border-destructive" : "border-input"
            }`}
          >
            {ALLOWED_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="text-xs text-destructive">{errors.role.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Status</label>
          <select
            {...register("status")}
            className={`w-full rounded-md border p-2 ${
              errors.status ? "border-destructive" : "border-input"
            }`}
          >
            {USER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          {errors.status && (
            <p className="text-xs text-destructive">{errors.status.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-foreground">
            <input
              {...register("autoVerify")}
              type="checkbox"
              className={`${
                errors.autoVerify ? "border-destructive" : "border-input"
              }`}
            />
            Auto-verify email
          </label>
          {errors.autoVerify && (
            <p className="text-xs text-destructive">
              {errors.autoVerify.message}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary text-primary-foreground p-2 rounded hover:bg-primary/90 disabled:bg-primary/50 transition-colors"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </span>
        ) : (
          "Create User"
        )}
      </button>
    </form>
  );
}
