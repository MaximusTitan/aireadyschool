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
}) {
  try {
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
}) {
  try {
    const result = await supabase.auth.admin.updateUserById(userId, {
      email: data.email,
      password: data.password,
      email_confirm: data.emailConfirm,
      user_metadata: {
        name: data.name,
        role: data.role,
        status: data.status,
      }
    });

    if (result.error) throw result.error;
    revalidatePath(ROLES_PAGE_PATH);
    return { success: true, data: result.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
