import { notFound } from "next/navigation";
import { ReactNode } from "react";
import { readSiteById } from "@/utils/actions/readSiteById";

export default async function SiteLayout({
  params,
  children,
}: {
  params: { site_id: string };
  children: ReactNode;
}) {
  const { site_id } = await params;
  const siteId = parseInt(site_id, 10);

  if (isNaN(siteId)) {
    notFound();
  }

  const result = await readSiteById(siteId);

  if (!result) {
    notFound();
  }

  const siteDomain = result.domain_id;

  return (
    <>
      {/* If you want <head> metadata here, use the Next.js Head component or metadata API */}
      <div className="site-layout-container">
        <h1>{siteDomain}</h1>
        {/* ...existing code... */}
        <main className="flex min-w-screen flex-col items-center justify-between mt-[1rem]">
          {children}
        </main>
      </div>
    </>
  );
}
