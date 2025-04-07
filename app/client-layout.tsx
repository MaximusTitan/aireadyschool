"use client";

import { ThemeProvider } from "next-themes";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AppSidebar } from "@/components/components-app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { createClient } from "@/utils/supabase/client";

// Component that uses useSearchParams
function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [hasCognitiveAssessment, setHasCognitiveAssessment] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<string | null>(null);

  useEffect(() => {
    const checkUserAndAssessment = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const role = session?.user?.user_metadata?.role;
      const email = session?.user?.email;
      const status = session?.user?.user_metadata?.status;

      setUserRole(role);
      setUserEmail(email ?? null);
      setUserStatus(status ?? null);

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

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  // Redirect to verification waiting page if status is disabled
  if (
    userStatus === "disabled" &&
    pathname !== "/verification-waiting" &&
    pathname !== "/sign-in"
  ) {
    window.location.href = "/verification-waiting";
    return null;
  }

  // Check if we're in canvas view mode
  const isCanvasViewMode =
    pathname.startsWith("/canvas-ai") && searchParams.get("mode") === "view";

  const showSidebar =
    !isCanvasViewMode &&
    pathname !== "/dat/school-registration" &&
    !pathname.startsWith("/dat/register/student/") &&
    !pathname.startsWith("/dat/school/register") &&
    (pathname.startsWith("/tools") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/chatbot") ||
      pathname.startsWith("/protected") ||
      pathname.startsWith("/schools") ||
      pathname.startsWith("/school") ||
      pathname.startsWith("/livebot") ||
      pathname.startsWith("/audiobot") ||
      pathname.startsWith("/learn-ai") ||
      pathname.startsWith("/payment") ||
      pathname.startsWith("/canvas") ||
      pathname.startsWith("/canvas-ai") ||
      pathname.startsWith("/rooms") ||
      pathname.startsWith("/games") ||
      pathname.startsWith("/logs") ||
      pathname.startsWith("/roles") ||
      pathname.startsWith("/document-vault") ||
      pathname.startsWith("/connect-database") ||
      pathname.startsWith("/feedback") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/guide") ||
      pathname.startsWith("/knowledge-base") ||
      pathname.startsWith("/dat-submissions") ||
      pathname.startsWith("/dat/") ||
      (pathname.startsWith("/portfolio") &&
        userRole === "Student" &&
        hasCognitiveAssessment));

  return (
    <>
      {showSidebar && <AppSidebar />}
      <main className="flex-1 flex flex-col">
        <div>{children}</div>
      </main>
    </>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  return (
    <SidebarProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Suspense fallback={<div>Loading...</div>}>
          <LayoutContent>{children}</LayoutContent>
        </Suspense>
        <Toaster />
      </ThemeProvider>
    </SidebarProvider>
  );
}
