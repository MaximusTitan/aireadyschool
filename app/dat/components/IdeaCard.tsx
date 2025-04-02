import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpandableSuggestions } from "./ExpandableSuggestions";
import { supabase } from "@/app/dat/utils/supabaseClient";
import { toast } from "sonner";

type IdeaStatus =
  | "not_submitted"
  | "review_pending"
  | "update_needed"
  | "review_updated"
  | "rejected"
  | "approved";

interface Idea {
  id: string;
  title: string;
  brief_description: string;
  why_this_idea: string;
  how_get_this_idea: string;
  status: IdeaStatus;
  created_at: string;
  admin_suggestions?: string;
  updated?: boolean;
}

interface IdeaCardProps {
  idea: Idea;
  submitSuggestion: (ideaId: string, suggestion: string) => Promise<void>;
  editingStatus: { [key: string]: boolean };
  setEditingStatus: (
    value: React.SetStateAction<{ [key: string]: boolean }>
  ) => void;
  tempStatus: { [key: string]: IdeaStatus };
  setTempStatus: (
    value: React.SetStateAction<{ [key: string]: IdeaStatus }>
  ) => void;
  handleApproval: (
    ideaId: string,
    newStatus: "approved" | "rejected"
  ) => Promise<void>;
  submitStatus: (ideaId: string) => Promise<void>;
  cancelEditStatus: (ideaId: string) => void;
  notifyIdeaChanges: (ideaId: string) => Promise<void>;
}

const IdeaCard: React.FC<IdeaCardProps> = ({
  idea,
  submitSuggestion,
  editingStatus,
  setEditingStatus,
  tempStatus,
  setTempStatus,
  handleApproval,
  submitStatus,
  cancelEditStatus,
}) => {
  const [suggestion, setSuggestion] = useState("");
  const [localAdminSuggestions, setLocalAdminSuggestions] = useState(
    idea.admin_suggestions
  );

  const getStatusColor = (status: IdeaStatus | undefined) => {
    switch (status) {
      case "approved":
        return {
          bg: "bg-green-50",
          text: "text-green-700",
          border: "border-green-200",
          icon: "✓",
        };
      case "rejected":
        return {
          bg: "bg-red-50",
          text: "text-red-700",
          border: "border-red-200",
          icon: "×",
        };
      default:
        return {
          bg: "bg-yellow-50",
          text: "text-yellow-700",
          border: "border-yellow-200",
          icon: "⋯",
        };
    }
  };

  const toggleEditStatus = (id: string) => {
    setEditingStatus((prev) => ({ ...prev, [id]: true }));
    setTempStatus((prev) => ({
      ...prev,
      [id]: idea.status || "not_submitted",
    }));
  };

  const primaryButtonClasses =
    "bg-rose-600 hover:bg-rose-500 text-white transition-colors duration-200";
  const secondaryButtonClasses =
    "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 transition-colors duration-200";

  const handleSaveSuggestion = async () => {
    if (!suggestion.trim()) return;

    const newSuggestion = localAdminSuggestions
      ? `${localAdminSuggestions}\n\nNew Suggestion (${new Date().toLocaleDateString()}):\n${suggestion}`
      : `New Suggestion (${new Date().toLocaleDateString()}):\n${suggestion}`;

    try {
      const { error } = await supabase
        .from("dat_ideas")
        .update({
          admin_suggestions: newSuggestion,
          status: "update_needed",
          updated: false,
        })
        .eq("id", idea.id)
        .select()
        .single();

      if (error) {
        console.error("Error saving suggestion:", error);
        toast.error("Failed to save suggestion");
        return;
      }

      // Update local states immediately
      setLocalAdminSuggestions(newSuggestion);
      setSuggestion("");
      // Pass just the suggestion string to parent component
      await submitSuggestion(idea.id, newSuggestion);
      toast.success("Suggestion saved successfully");
    } catch (error) {
      console.error("Error in handleSaveSuggestion:", error);
      toast.error("Failed to save suggestion");
    }
  };

  return (
    <Card key={idea.id} className="shadow-md rounded-xl">
      <CardHeader className="border-b pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Idea
              <p className="text-sm text-gray-500">
                Submitted on {new Date(idea.created_at).toLocaleDateString()}
              </p>
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6 px-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-gray-900">{idea.title}</h2>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">Description</h3>
          <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
            {idea.brief_description}
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">
              Why This Idea?
            </h3>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
              {idea.why_this_idea}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">
              How Did You Get This Idea?
            </h3>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
              {idea.how_get_this_idea}
            </p>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Admin Suggestions
          </h3>

          {localAdminSuggestions && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <ExpandableSuggestions suggestions={localAdminSuggestions} />
            </div>
          )}

          <div className="flex flex-col space-y-2 mt-6">
            <h4 className="text-sm font-medium text-gray-700">
              Add New Suggestion:
            </h4>
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              className="border rounded-md p-2"
              rows={3}
              placeholder="Type your new suggestion here..."
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSaveSuggestion}
                variant="outline"
                size="sm"
                disabled={!suggestion.trim()}
              >
                Send
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">
              Status Control
            </h3>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                getStatusColor(idea.status).bg
              } ${getStatusColor(idea.status).text} border ${
                getStatusColor(idea.status).border
              }`}
            >
              <span className="mr-1">{getStatusColor(idea.status).icon}</span>
              {idea.status
                ? idea.status.charAt(0).toUpperCase() + idea.status.slice(1)
                : "Not Submitted"}
            </div>
          </div>

          {editingStatus[idea.id] ? (
            <div className="flex items-center gap-2">
              <select
                value={tempStatus[idea.id]}
                onChange={(e) =>
                  setTempStatus((prev) => ({
                    ...prev,
                    [idea.id]: e.target.value as IdeaStatus,
                  }))
                }
                className="text-sm border rounded-md py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
                style={{ backgroundColor: "#F7F1EF" }}
              >
                <option value="not_submitted">Not Submitted</option>
                <option value="review_pending">Review Pending</option>
                <option value="update_needed">Update Needed</option>
                <option value="review_updated">Review Updated</option>
                <option value="rejected">Rejected</option>
                <option value="approved">Approved</option>
              </select>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => submitStatus(idea.id)}
                  className={primaryButtonClasses}
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cancelEditStatus(idea.id)}
                  className={secondaryButtonClasses}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {idea.status === "review_pending" ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApproval(idea.id, "approved")}
                    className={primaryButtonClasses}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApproval(idea.id, "rejected")}
                    className={secondaryButtonClasses}
                  >
                    Reject
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleEditStatus(idea.id)}
                  className={primaryButtonClasses}
                >
                  Change Status
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default IdeaCard;
