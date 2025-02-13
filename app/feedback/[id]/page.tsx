"use client";

import { useState, useEffect } from "react";
import { ChevronUp, MessageSquare, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useParams, useRouter } from "next/navigation"; // Ensure useRouter is imported
import { createClient } from "@/utils/supabase/client";

export default function FeedbackDetailPage() {
  const supabase = createClient();
  const { id } = useParams(); // Get the ID from the route
  const router = useRouter(); // Add useRouter hook
  const [feedback, setFeedback] = useState<any>(null);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState<any>(null);
  const [commentError, setCommentError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      }

      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        setFeedback(data);
      }
    };

    fetchData();
  }, [id, supabase]);

  const handleUpvote = async () => {
    if (!feedback) return;
    const updatedVotes = (feedback.upvotes ?? 0) + 1;
    const { error } = await supabase
      .from("feedback")
      .update({ upvotes: updatedVotes })
      .eq("id", id);
    if (!error) {
      setFeedback({ ...feedback, upvotes: updatedVotes });
    }
  };

  const handleAddComment = async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      setCommentError("You must be logged in to comment.");
      return;
    }

    if (!feedback) {
      setCommentError("Cannot add comment at this time.");
      return;
    }

    if (!newComment || newComment.trim().length === 0) {
      setCommentError("Comment cannot be empty.");
      return;
    }

    setCommentError("");
    const updatedComments = [
      ...(feedback.comments || []),
      {
        author: currentUser.email,
        text: newComment.trim(),
        date: new Date().toISOString(),
      },
    ];

    const { error } = await supabase
      .from("feedback")
      .update({ comments: updatedComments })
      .eq("id", id);

    if (error) {
      setCommentError("Failed to add comment. Please try again.");
      return;
    }

    setFeedback({ ...feedback, comments: updatedComments });
    setNewComment("");
  };

  if (!feedback) {
    // Added loading state
    return <div>Loading feedback...</div>;
  }

  return (
    <div className="bg-rose-50/25 min-h-screen w-full">
      <div className="container mx-auto py-6 max-w-5xl">
        <Button
          variant="outline"
          size="sm"
          className="w-fit mb-6"
          onClick={() => router.back()}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column: Feedback */}
          <div>
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="h-fit flex flex-col items-center px-2 py-3 gap-1"
                    size="sm"
                    onClick={handleUpvote}
                  >
                    <ChevronUp className="w-4 h-4 text-rose-500" />
                    <span className="text-rose-500">{feedback.upvotes}</span>
                  </Button>
                  <div className="space-y-2 flex-1">
                    <CardTitle className="text-xl font-semibold">
                      {feedback.title}
                    </CardTitle>
                    <p className="text-muted-foreground">
                      {feedback.description}
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {" "}
                          {/* Reduced text size */}
                          {feedback.author
                            ? feedback.author
                                .split(" ")
                                .map((name: string) => name.charAt(0))
                                .join("")
                            : "A"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {feedback.author} •{" "}
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Add Comment and Comments */}
          <div className="space-y-4">
            {/* Add Comment Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {" "}
                      {/* Reduced text size */}U
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Leave a comment"
                      className="min-h-[100px]"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    {commentError && (
                      <p className="text-red-500 text-sm">{commentError}</p>
                    )}
                    <Button
                      className="mt-4 bg-rose-500 hover:bg-rose-600"
                      onClick={handleAddComment}
                    >
                      Submit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>Comments</span>
            </div>

            {feedback.comments.map((comment: any, index: number) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {" "}
                        {/* Reduced text size */}
                        {comment.author
                          ? (comment.author as string)
                              .split(" ")
                              .map((name: string) => name.charAt(0))
                              .join("")
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{comment.author}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(comment.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{comment.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
