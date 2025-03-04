"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { PDFDownload } from "./PDFDownload";

interface AssignmentHistoryItem {
  id: number;
  title: string;
  content: string;
  created_at: string;
  grade_level: string;
  assignment_type: string;
}

interface AssignmentHistoryProps {
  userEmail: string;
  onSelectAssignment: (assignment: { title: string; content: string }) => void;
}

export function AssignmentHistory({
  userEmail,
  onSelectAssignment,
}: AssignmentHistoryProps) {
  const [history, setHistory] = useState<AssignmentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      const supabase = createClient();
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize - 1;
      const { data, error, count } = await supabase
        .from("assignment_history")
        .select(
          "id, title, content, created_at, grade_level, assignment_type",
          { count: "exact" }
        )
        .eq("email", userEmail)
        .order("created_at", { ascending: false })
        .range(start, end);
      if (error) {
        console.error(error);
      } else {
        setHistory(data || []);
        setTotalPages(count ? Math.ceil(count / pageSize) : 0);
      }
      setIsLoading(false);
    }
    if (userEmail) {
      fetchHistory();
    }
  }, [userEmail, currentPage]);

  if (isLoading) {
    return <Skeleton className="h-24 w-full mt-4" />;
  }
  if (!history.length) {
    return (
      <p className="mt-4 text-center text-muted-foreground">
        No assignment history found.
      </p>
    );
  }
  return (
    <>
      <Card className="mt-8 mb-8 max-w-6xl mx-auto">
        <CardHeader className="border-b bg-muted/50">
          <CardTitle className="text-xl font-bold">
            Assignment History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ul className="space-y-4">
            {history.map((item) => (
              <li
                key={item.id}
                onClick={() =>
                  onSelectAssignment({
                    title: item.title,
                    content: item.content,
                  })
                }
                className="group p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/50 hover:border-primary"
              >
                <div className="font-semibold text-lg text-primary group-hover:text-primary/80">
                  {item.title}
                </div>
                <div className="text-sm text-gray-600 line-clamp-3 mt-2 mb-3">
                  {item.content}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Grade: {item.grade_level} | Type: {item.assignment_type} |{" "}
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                  <PDFDownload title={item.title} content={item.content} />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <div className="flex justify-center items-center gap-3 mt-6 pb-8">
        {currentPage > 1 && (
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            Previous
          </Button>
        )}
        <div className="flex gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i}
              type="button"
              variant={currentPage === i + 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
        </div>
        {currentPage < totalPages && (
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next
          </Button>
        )}
      </div>
    </>
  );
}
