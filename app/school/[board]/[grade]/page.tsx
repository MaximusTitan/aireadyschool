"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { Grade, Section } from "@/app/school/types";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

export default function GradePage({
  params,
}: {
  params: Promise<{ board: string; grade: string }>;
}) {
  const resolvedParams = use(params);
  const [gradeData, setGradeData] = useState<Grade | null>(null);
  const supabase = createClient();
  const decodedBoardName = decodeURIComponent(resolvedParams.board);
  const decodedGradeName = decodeURIComponent(resolvedParams.grade);

  useEffect(() => {
    const fetchGrade = async () => {
      const { data: boardData } = await supabase
        .from("boards")
        .select("id")
        .eq("name", decodedBoardName)
        .single();

      if (boardData) {
        const { data, error } = await supabase
          .from("grades")
          .select(
            `
            id,
            name,
            sections (
              id,
              name
            )
          `
          )
          .eq("board_id", boardData.id)
          .eq("name", decodedGradeName)
          .single();

        if (error) {
          console.error("Error fetching grade:", error);
          return;
        }

        if (data?.sections) {
          const sortedSections = [...data.sections].sort(
            (a: Section, b: Section) => a.name.localeCompare(b.name)
          );
          setGradeData({ ...data, sections: sortedSections });
        }
      }
    };

    fetchGrade();
  }, [decodedBoardName, decodedGradeName]);

  if (!gradeData) return <div>Loading...</div>;

  return (
    <div className="container py-10">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/school">School</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/school/${resolvedParams.board}`}>
              {decodedBoardName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{gradeData.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold mb-8">{gradeData.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {gradeData.sections?.map((section) => (
          <Link
            href={`/school/${encodeURIComponent(decodedBoardName)}/${encodeURIComponent(gradeData.name)}/Section-${encodeURIComponent(section.name)}`}
            key={section.id}
          >
            <Card className="hover:bg-muted transition-colors cursor-pointer">
              <CardHeader>
                <h3 className="text-xl font-semibold">
                  Section {section.name}
                </h3>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
