"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookOpen, PlusCircle, ArrowRight, Layers, School } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BoardPage({
  params,
}: {
  params: Promise<{ board: string }>;
}) {
  const resolvedParams = use(params);
  const [boardData, setBoardData] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const decodedBoardName = decodeURIComponent(resolvedParams.board);

  useEffect(() => {
    const fetchBoard = async () => {
      setIsLoading(true);
      try {
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoard();
  }, [decodedBoardName]);

  const GradesSkeleton = () => (
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
              <BreadcrumbPage>{decodedBoardName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold flex items-center">
              <BookOpen className="mr-2 h-8 w-8 text-primary" />
              {decodedBoardName}
            </h1>
            <p className="text-muted-foreground">
              Select a grade to view its sections and classes
            </p>
          </div>
          
          {!isLoading && boardData && (
            <Badge variant="outline" className="text-sm py-1 px-3">
              {boardData.grades?.length || 0} Grade{boardData.grades?.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Grades</h2>
          <Button size="sm" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Add Grade</span>
          </Button>
        </div>

        {isLoading ? (
          <GradesSkeleton />
        ) : !boardData ? (
          <div className="text-center p-8 bg-muted rounded-md">
            <School className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Board not found</h3>
            <p className="text-muted-foreground mt-2">Unable to load the board data.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {boardData.grades && boardData.grades.length > 0 ? (
              boardData.grades.map((grade) => (
                <Link
                  href={`/school/${encodeURIComponent(boardData.name)}/${encodeURIComponent(grade.name)}`}
                  key={grade.id}
                  className="block group"
                >
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer hover:shadow-md border-muted overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">{grade.name}</h3>
                        <Layers className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-muted-foreground text-sm">
                        Board: {boardData.name}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-end bg-muted/30 pt-2">
                      <Button variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground">
                        View Sections
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-10 px-4 text-center bg-muted/30 rounded-lg">
                <Layers className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-3">No grades available for this board.</p>
                <Button size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Grade
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
