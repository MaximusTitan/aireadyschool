import { notFound } from "next/navigation";
import { readSiteById } from "@/utils/actions/readSiteById";

export default async function SitePage({
  params,
}: {
  params: Promise<{ site_id: string }>;
}) {
  const { site_id } = await params;
  const siteId = parseInt(site_id, 10);

  if (isNaN(siteId)) {
    notFound();
  }

  const site = await readSiteById(siteId);

  if (!site) {
    notFound();
  }

  return (
    <div className="container">
      <h1>Site Details</h1>
      <ul>
        <li>
          <strong>ID:</strong> {site.id}
        </li>
        <li>
          <strong>Domain ID:</strong> {site.domain_id}
        </li>
        {/* Add more details here if available */}
      </ul>
    </div>
  );
}
