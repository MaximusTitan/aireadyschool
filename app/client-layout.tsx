"use client";

import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import {
  AppSidebar,
  AppSidebarHeader,
} from "@/components/components-app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
    pathname.startsWith("/document-vault");

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
          {showSidebar && <AppSidebarHeader />}
          <div>{children}</div>
        </main>
        <Toaster />
      </ThemeProvider>
    </SidebarProvider>
  );
}
