import { notFound } from "next/navigation";
import { ReactNode } from "react";
import { readSiteById } from "@/utils/actions/readSiteById";

export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <div className="site-layout-container">
        <main>{children}</main>
      </div>
    </>
  );
}
