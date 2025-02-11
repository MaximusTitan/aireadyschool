import type { Metadata } from "next";
import { getPresentation } from "../../../actions/savePresentations";
import { PresentationViewer } from "./PresentationViewer";
import { notFound } from "next/navigation";

// ✅ Use Next.js built-in types correctly
type PageProps = {
  params: { id: string };
};

// ✅ Fix Type Issue: Ensure params is not treated as a Promise
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!params?.id) {
    console.error("Missing presentation ID");
    return {
      title: "Presentation Not Found",
    };
  }

  try {
    const { presentation } = await getPresentation(params.id);
    return {
      title: presentation ? `${presentation.topic} | Presentation` : "Presentation Not Found",
    };
  } catch (error) {
    console.error("Metadata generation error:", error);
    return { title: "Presentation Not Found" };
  }
}

// ✅ Properly typed page function
export default async function PresentationPage({ params }: PageProps) {
  if (!params?.id) {
    console.error("Missing presentation ID");
    return notFound();
  }

  try {
    console.log("Fetching presentation with ID:", params.id);
    const { presentation, error } = await getPresentation(params.id);

    if (error || !presentation) {
      console.error("Error fetching presentation:", error);
      return notFound();
    }

    return <PresentationViewer presentation={presentation} />;
  } catch (error) {
    console.error("Unexpected error in presentation page:", error);
    return notFound();
  }
}
