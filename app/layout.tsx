import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Metadata } from "next";
import ClientLayout from "./client-layout";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  title: "AI Ready School",
  description: "The Power of AI to Empower Everyone at the School",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
