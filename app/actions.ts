//Regular Signup and Login

"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const role = formData.get("role")?.toString();
  const name = formData.get("name")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password || !role || !name) {
    return { error: "Name, email, password, and role are required" };
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        name,
        role,
        status: 'disabled',  // Set initial status as disabled
        email: email,
      },
    },
  });

  if (signUpError) {
    console.error(signUpError.code + " " + signUpError.message);
    return encodedRedirect("error", "/sign-up", signUpError.message);
  }

  // Insert user data into users table
  const { error: insertError } = await supabase
    .from('users')
    .insert({
      email: email,
      user_id: signUpData.user!.id,
      role_type: role,
      image_credits: 25,
      video_credits: 5
    });

  if (insertError) {
    console.error("Database insert error:", insertError);
    return encodedRedirect("error", "/sign-up", "Error creating user profile");
  }

  // Initialize tokens
  const { error: tokenError } = await supabase
    .from("tokens")
    .insert({
      user_id: signUpData.user!.id,
      input_tokens: 250000,
      output_tokens: 50000,
    });

  if (tokenError) {
    console.error("Token initialization error:", tokenError);
    return encodedRedirect("error", "/sign-up", "Error initializing user tokens");
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link."
  );
};

export const schoolSignUpAction = async (formData: FormData, site_id: string) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const role = formData.get("role")?.toString();
  const name = formData.get("name")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password || !role || !name) {
    return { error: "Name, email, password, and role are required" };
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        name,
        role,
        site_id: site_id.toLowerCase(),
        status: 'disabled',
        email: email,
      },
    },
  });

  if (signUpError) {
    console.error(signUpError.code + " " + signUpError.message);
    return encodedRedirect("error", `/sign-up`, signUpError.message);
  }

  // Insert user data into users table
  const { error: insertError } = await supabase
    .from('users')
    .insert({
      user_id: signUpData.user!.id,
      role_type: role,
      site_id: site_id.toLowerCase(),
      image_credits: 25,
      video_credits: 25
    });

  if (insertError) {
    console.error("Database insert error:", insertError);
    return encodedRedirect("error", "/sign-up", "Error creating user profile");
  }

  // Initialize tokens
  const { error: tokenError } = await supabase
    .from("tokens")
    .insert({
      user_id: signUpData.user!.id,
      input_tokens: 250000,
      output_tokens: 50000,
    });

  if (tokenError) {
    console.error("Token initialization error:", tokenError);
    return encodedRedirect("error", "/sign-up", "Error initializing user tokens");
  }

  return encodedRedirect(
    "success",
    `/sign-up`,
    "Thanks for signing up! Please check your email for a verification link."
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  // Get user role from metadata
  const role = authData.user?.user_metadata?.role;

  // Check for DAT roles and redirect accordingly
  if (role) {
    if (role === "dat_admin") {
      return redirect("/dat/admin");
    } else if (role === "dat_judge") {
      return redirect("/dat/judge");
    } else if (role === "dat_student") {
      return redirect("/dat/student");
    } else if (role === "dat_school") {
      // Check school approval status
      const { data: schoolData } = await supabase
        .from("dat_school_details")
        .select("status")
        .eq("email", email)
        .maybeSingle();

      if (schoolData?.status === "pending") {
        return redirect("/dat/school/pending");
      } else if (schoolData?.status === "rejected") {
        return redirect("/dat/school/rejected");
      } else {
        return redirect("/dat/school");
      }
    }
  }

  // Default redirect for non-DAT roles
  return redirect("/tools");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/");
};
