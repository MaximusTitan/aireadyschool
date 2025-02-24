"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { Grade, Board } from "@/app/school/types";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

export default function BoardPage({
  params,
}: {
  params: Promise<{ board: string }>;
}) {
  const resolvedParams = use(params);
  const [boardData, setBoardData] = useState<Board | null>(null);
  const supabase = createClient();
  const decodedBoardName = decodeURIComponent(resolvedParams.board);

  useEffect(() => {
    const fetchBoard = async () => {
      const { data, error } = await supabase
        .from("boards")
        .select(
          `
          id,
          name,
          grades (
            id,
            name
          )
        `
        )
        .eq("name", decodedBoardName)
        .single();

      if (error) {
        console.error("Error fetching board:", error);
        return;
      }

      if (data) {
        const sortedGrades = [...data.grades].sort(
          (a: Grade, b: Grade) =>
            parseInt(a.name.replace("Grade ", "")) -
            parseInt(b.name.replace("Grade ", ""))
        );
        setBoardData({ ...data, grades: sortedGrades });
      }
    };

    fetchBoard();
  }, [decodedBoardName]);

  if (!boardData) return <div>Loading...</div>;

  return (
    <div className="container py-10">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/school">School</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{boardData.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold mb-8">{boardData.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {boardData.grades?.map((grade) => (
          <Link
            href={`/school/${encodeURIComponent(boardData.name)}/${encodeURIComponent(grade.name)}`}
            key={grade.id}
          >
            <Card className="hover:bg-muted transition-colors cursor-pointer">
              <CardHeader>
                <h3 className="text-xl font-semibold">{grade.name}</h3>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
