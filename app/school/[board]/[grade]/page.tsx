"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookOpen, PlusCircle, ArrowRight, Layers, School, Users, Gamepad2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function GradePage({
  params,
}: {
  params: Promise<{ board: string; grade: string }>;
}) {
  const resolvedParams = use(params);
  const [gradeData, setGradeData] = useState<Grade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const decodedBoardName = decodeURIComponent(resolvedParams.board);
  const decodedGradeName = decodeURIComponent(resolvedParams.grade);

  useEffect(() => {
    const fetchGrade = async () => {
      setIsLoading(true);
      try {
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrade();
  }, [decodedBoardName, decodedGradeName]);

  const SectionsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-3/4 mb-2" />
          </CardHeader>
          <CardContent className="pb-2">
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
          <CardFooter className="flex justify-end bg-muted/30 pt-2">
            <Skeleton className="h-9 w-24" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="container py-10 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-lg p-6 shadow-sm mb-6">
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
              <BreadcrumbPage>{decodedGradeName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold flex items-center">
              <Layers className="mr-2 h-8 w-8 text-primary" />
              {decodedGradeName}
            </h1>
            <p className="text-muted-foreground flex items-center">
              <BookOpen className="h-4 w-4 mr-1.5" />
              <span>{decodedBoardName}</span>
            </p>
          </div>
          
          {!isLoading && gradeData && (
            <Badge variant="outline" className="text-sm py-1 px-3">
              {gradeData.sections?.length || 0} Section{(gradeData.sections?.length || 0) !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Sections</h2>
          <Button size="sm" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Add Section</span>
          </Button>
        </div>

        {isLoading ? (
          <SectionsSkeleton />
        ) : !gradeData ? (
          <div className="text-center p-8 bg-muted rounded-md">
            <School className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Grade not found</h3>
            <p className="text-muted-foreground mt-2">Unable to load the grade data.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {(gradeData.sections?.length || 0) > 0 ? (
              gradeData.sections?.map((section) => (
                <Link
                  href={`/school/${encodeURIComponent(decodedBoardName)}/${encodeURIComponent(gradeData.name)}/Section-${encodeURIComponent(section.name)}`}
                  key={section.id}
                  className="block group"
                >
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer hover:shadow-md border-muted overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                          Section {section.name}
                        </h3>
                        <Users className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="text-muted-foreground text-sm flex items-center">
                        <Gamepad2 className="h-3.5 w-3.5 mr-1.5" />
                        <span>{decodedGradeName}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end bg-muted/30 pt-2">
                      <Button variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground">
                        View Details
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-10 px-4 text-center bg-muted/30 rounded-lg">
                <Users className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-3">No sections available for this grade.</p>
                <Button size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
