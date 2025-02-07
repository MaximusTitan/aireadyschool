"use client";

import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/components-app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { createClient } from "@/utils/supabase/client";
import path from "path";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const supabase = createClient();
  const [hasCognitiveAssessment, setHasCognitiveAssessment] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkUserAndAssessment = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const role = session?.user?.user_metadata?.role;
      const email = session?.user?.email;

      setUserRole(role);
      setUserEmail(email ?? null);

      if (role === "Student" && email) {
        const { data } = await supabase
          .from("cognitive_assessments")
          .select("student_email")
          .eq("student_email", email)
          .single();

        setHasCognitiveAssessment(!!data);
      }
    };

    checkUserAndAssessment();
  }, []);

  const showSidebar =
    pathname.startsWith("/tools") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/chatbot") ||
    pathname.startsWith("/protected") ||
    pathname.startsWith("/schools") ||
    pathname.startsWith("/livebot") ||
    pathname.startsWith("/audiobot") ||
    pathname.startsWith("/learn-ai") ||
    pathname.startsWith("/payment") ||
    pathname.startsWith("/canvas") ||
    pathname.startsWith("/rooms") ||
    pathname.startsWith("/games") ||
    pathname.startsWith("/logs") ||
    pathname.startsWith("/document-vault") ||
    (pathname.startsWith("/profile") &&
      userRole === "Student" &&
      hasCognitiveAssessment);

  return (
    <SidebarProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {showSidebar && <AppSidebar />}
        <main className="flex-1 flex flex-col">
          <div>{children}</div>
        </main>
        <Toaster />
      </ThemeProvider>
    </SidebarProvider>
  );
}
