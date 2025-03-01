'use server'

import { createClient } from "@supabase/supabase-js";
import { UserRole, UserStatus } from "./types";
import { revalidatePath } from "next/cache";

const ROLES_PAGE_PATH = "/roles";

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

export async function createUserAction(data: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  autoVerify: boolean;
  image_credits: number;
  video_credits: number;
}) {
  try {
    // Create auth user
    const result = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: data.autoVerify,
      user_metadata: { 
        name: data.name,
        role: data.role,
        status: data.status,
        email_verified: data.autoVerify,
        phone_verified: false
      }
    });

    if (result.error) throw result.error;

    // Create user record in public.users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        user_id: result.data.user.id,
        email: data.email,
        role_type: data.role,
        image_credits: data.image_credits,
        video_credits: data.video_credits,
      });

    if (userError) throw userError;

    revalidatePath(ROLES_PAGE_PATH);
    return { success: true, data: result.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUserAction(userId: string, data: {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
  status?: UserStatus;
  emailConfirm?: boolean;
  image_credits?: number;
  video_credits?: number;
}) {
  try {
    // Update auth user data
    const authResult = await supabase.auth.admin.updateUserById(userId, {
      email: data.email,
      password: data.password,
      email_confirm: data.emailConfirm,
      user_metadata: {
        name: data.name,
        role: data.role,
        status: data.status,
      }
    });

    if (authResult.error) throw authResult.error;

    // Only update credits if they are provided
    if (typeof data.image_credits === 'number' || typeof data.video_credits === 'number') {
      const updates: any = {};
      if (typeof data.image_credits === 'number') updates.image_credits = data.image_credits;
      if (typeof data.video_credits === 'number') updates.video_credits = data.video_credits;

      const { error: creditsError } = await supabase
        .from('users')
        .update(updates)
        .eq('user_id', userId);

      if (creditsError) throw creditsError;
    }

    revalidatePath(ROLES_PAGE_PATH);
    return { success: true, data: authResult.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
