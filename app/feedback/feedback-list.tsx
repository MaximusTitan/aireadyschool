"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";

interface Feedback {
  id: string; // or number, depending on your DB
  title: string;
  description: string;
  upvotes: number;
  comments: any[]; // array of comment objects in DB (JSONB)
  author: string;
  created_at: string;
}

export default function FeedbackList() {
  const [feedbackData, setFeedbackData] = useState<Feedback[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchFeedback = async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setFeedbackData(data as Feedback[]);
      }
    };
    fetchFeedback();
  }, [supabase]);

  const handleUpvote = async (id: string) => {
    try {
      const item = feedbackData.find((f) => f.id === id);
      if (!item) return;
      await supabase
        .from("feedback")
        .update({ upvotes: item.upvotes + 1 })
        .match({ id });
      setFeedbackData((prevData) =>
        prevData.map((f) =>
          f.id === id ? { ...f, upvotes: f.upvotes + 1 } : f
        )
      );
    } catch (error) {
      console.error("Error upvoting:", error);
    }
  };

  const handleFeedbackClick = (id: string) => {
    router.push(`/feedback/${id}`);
  };

  return (
    <div className="space-y-4">
      {feedbackData.map((feedback) => (
        <Card
          key={feedback.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleFeedbackClick(feedback.id)}
        >
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="h-fit flex flex-col items-center px-2 py-3 gap-1"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpvote(feedback.id);
                }}
              >
                <ChevronUp className="w-4 h-4 text-rose-500" />
                <span className="text-rose-500">{feedback.upvotes}</span>
              </Button>
              <div className="space-y-2 flex-1">
                <CardTitle className="text-lg font-semibold">
                  {feedback.title}
                </CardTitle>
                <p className="text-muted-foreground">{feedback.description}</p>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {feedback.author
                          ? feedback.author
                              .split(" ")
                              .map((name) => name.charAt(0))
                              .join("")
                          : "A"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {feedback.author} •{" "}
                      {new Date(feedback.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    {feedback.comments?.length || 0}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
