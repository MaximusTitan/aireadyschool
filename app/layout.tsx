"use client";

import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import "./globals.css";
import {
  AppSidebar,
  AppSidebarHeader,
} from "@/components/components-app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/server";
import { Toaster } from "@/components/ui/toaster";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Define paths where the sidebar SHOULD be shown (instead of where to hide it)
  const showSidebar =
    pathname.startsWith("/tools") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/chatbot") ||
    pathname.startsWith("/protected") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/schools") ||
    // pathname.startsWith("/livebot") ||
    pathname.startsWith("/rooms");

  return (
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
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
              <div className="p-4">{children}</div>
            </main>
            <Toaster />
          </ThemeProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
