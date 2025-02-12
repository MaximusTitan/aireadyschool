import { getPresentation } from "../../../actions/savePresentations";
import { PresentationViewer } from "./PresentationViewer";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  // Await the params promise
  const { id } = await params;
  const { presentation } = await getPresentation(id);

  if (!presentation) {
    return notFound();
  }

  return <PresentationViewer presentation={presentation} />;
}