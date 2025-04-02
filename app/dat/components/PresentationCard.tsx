import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/app/dat/utils/supabaseClient";
import { ExpandableSuggestions } from "@/app/dat/components/ExpandableSuggestions";
import { toast } from "sonner";

// Update the PresentationStatus type to include winner and runner-up statuses
export type PresentationStatus =
  | "not_submitted"
  | "review_pending"
  | "update_needed"
  | "review_updated"
  | "rejected"
  | "qualified_for_round1"
  | "submit_presentation"
  | "round1_winner" // Changed from winner_selected
  | "round1_runner_up"; // Changed from runner_up_selected

interface PresentationCardProps {
  presentationLink: string | null;
  presentationStatus: PresentationStatus;
  setPresentationStatus: (
    value: React.SetStateAction<PresentationStatus>
  ) => void;
  editingPresentationStatus: boolean;
  presentationTempStatus: PresentationStatus;
  setPresentationTempStatus: (
    value: React.SetStateAction<PresentationStatus>
  ) => void;
  submitPresentationStatus: () => Promise<void>;
  cancelEditPresentationStatus: () => void;
  toggleEditPresentationStatus: () => void;
  copySuccess: boolean;
  setCopySuccess: (value: React.SetStateAction<boolean>) => void; // Add this line
  presentationVisible: boolean;
  setPresentationVisible: (value: React.SetStateAction<boolean>) => void;
  isFullScreen: boolean;
  setIsFullScreen: (value: React.SetStateAction<boolean>) => void;
  studentId: string;
  created_at?: string;
  admin_suggestions?: string;
  submitSuggestion: (suggestion: string) => Promise<void>;
  disableWinner?: boolean; // New prop to disable Winner button
  disableRunnerUp?: boolean; // New prop to disable Runner Up button
}

const PresentationCard: React.FC<PresentationCardProps> = ({
  presentationLink,
  presentationStatus,
  setPresentationStatus,
  editingPresentationStatus,
  presentationTempStatus,
  setPresentationTempStatus,
  submitPresentationStatus,
  cancelEditPresentationStatus,
  toggleEditPresentationStatus,
  copySuccess,
  setCopySuccess, // Add this to destructuring
  presentationVisible,
  setPresentationVisible,
  studentId,
  created_at,
  admin_suggestions,
  submitSuggestion,
  disableWinner = false,
  disableRunnerUp = false,
}) => {
  const [suggestion, setSuggestion] = useState("");
  const [localAdminSuggestions, setLocalAdminSuggestions] =
    useState(admin_suggestions);

  const handleSaveSuggestion = async () => {
    if (!suggestion.trim()) return;

    const newSuggestion = localAdminSuggestions
      ? `${localAdminSuggestions}\n\nNew Suggestion (${new Date().toLocaleDateString()}):\n${suggestion}`
      : `New Suggestion (${new Date().toLocaleDateString()}):\n${suggestion}`;

    try {
      const { error } = await supabase
        .from("dat_presentation_links")
        .update({
          admin_suggestions: newSuggestion,
          status: "update_needed",
          updated: false,
        })
        .eq("student_id", studentId)
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
      setPresentationStatus("update_needed");
      await submitSuggestion(newSuggestion);
      toast.success("Suggestion saved successfully");
    } catch (error) {
      console.error("Error in handleSaveSuggestion:", error);
      toast.error("Failed to save suggestion");
    }
  };

  const getStatusColor = (status: PresentationStatus) => {
    switch (status) {
      case "qualified_for_round1": // changed from qualified_round1
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
      case "not_submitted":
        return {
          bg: "bg-gray-50",
          text: "text-gray-700",
          border: "border-gray-200",
          icon: "⌀",
        };
      case "review_pending":
        return {
          bg: "bg-blue-50",
          text: "text-blue-700",
          border: "border-blue-200",
          icon: "⌛",
        };
      case "update_needed":
        return {
          bg: "bg-yellow-50",
          text: "text-yellow-700",
          border: "border-yellow-200",
          icon: "!",
        };
      case "review_updated":
        return {
          bg: "bg-orange-50",
          text: "text-orange-700",
          border: "border-orange-200",
          icon: "↻",
        };
      case "submit_presentation":
        return {
          bg: "bg-purple-50",
          text: "text-purple-700",
          border: "border-purple-200",
          icon: "✚",
        };
      case "round1_winner": // Changed from winner_selected
        return {
          bg: "bg-indigo-50",
          text: "text-indigo-700",
          border: "border-indigo-200",
          icon: "🏆",
        };
      case "round1_runner_up": // Changed from runner_up_selected
        return {
          bg: "bg-teal-50",
          text: "text-teal-700",
          border: "border-teal-200",
          icon: "🥈",
        };
      default:
        return {
          bg: "bg-blue-50",
          text: "text-blue-700",
          border: "border-blue-200",
          icon: "⋯",
        };
    }
  };

  // New function: Update final presentation status based on winner/runner-up action
  const updateFinalStatus = async (newStatus: PresentationStatus) => {
    const { error } = await supabase
      .from("dat_presentation_links")
      .update({ status: newStatus })
      .eq("student_id", studentId);
    if (!error) {
      setPresentationStatus(newStatus);
    }
  };

  const primaryButtonClasses =
    "bg-rose-600 hover:bg-rose-500 text-white transition-colors duration-200";
  const secondaryButtonClasses =
    "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 transition-colors duration-200";

  const formatPresentationLink = (url: string) => {
    if (url.includes("docs.google.com/presentation")) {
      const baseUrl = url
        .split("/edit")[0]
        .split("/preview")[0]
        .split("/embed")[0];
      return `${baseUrl}/embed`;
    }
    return url;
  };

  const getOriginalLink = (url: string) => {
    if (url.includes("docs.google.com/presentation")) {
      return url.split("/embed")[0] + "/edit";
    }
    return url;
  };

  if (!presentationLink) {
    return (
      <Card className="mt-6 shadow opacity-75">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Presentation
            </CardTitle>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              Not Submitted
            </span>
          </div>
        </CardHeader>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <p>Student hasn&apos;t submitted a presentation yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 shadow-md rounded-xl">
      <CardHeader className="border-b pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Presentation
              {created_at && (
                <p className="text-sm text-gray-500">
                  Submitted on {new Date(created_at).toLocaleDateString()}
                </p>
              )}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6 px-6">
        {/* Link Section */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setPresentationVisible(!presentationVisible)}
            className={primaryButtonClasses}
          >
            {presentationVisible ? "Hide Presentation" : "View Presentation"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(
                getOriginalLink(presentationLink || "")
              );
              setCopySuccess(true);
              setTimeout(() => setCopySuccess(false), 2000);
            }}
            className={secondaryButtonClasses}
          >
            {copySuccess ? "Link Copied!" : "Copy Link"}
          </Button>
        </div>

        {/* Presentation Viewer */}
        {presentationVisible && (
          <div className="aspect-video w-full max-w-3xl mx-auto bg-gray-100 rounded-lg overflow-hidden">
            <iframe
              src={formatPresentationLink(presentationLink || "")}
              title="Presentation"
              width="100%"
              height="100%"
              style={{ border: "none" }}
              allowFullScreen
            />
          </div>
        )}

        {/* Admin Suggestions Section */}
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

        {/* Status Control Section */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">
              Status Control
            </h3>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(presentationStatus).bg} ${getStatusColor(presentationStatus).text} border ${getStatusColor(presentationStatus).border}`}
            >
              <span className="mr-1">
                {getStatusColor(presentationStatus).icon}
              </span>
              {presentationStatus.charAt(0).toUpperCase() +
                presentationStatus.slice(1)}
            </div>
          </div>
          {editingPresentationStatus ? (
            <div className="flex items-center gap-2">
              <select
                value={presentationTempStatus}
                onChange={(e) =>
                  setPresentationTempStatus(
                    e.target.value as PresentationStatus
                  )
                }
                className="text-sm border rounded-md py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
                style={{ backgroundColor: "#F7F1EF" }}
              >
                <option value="not_submitted">Not Submitted</option>
                <option value="review_pending">Review Pending</option>
                <option value="update_needed">Update Needed</option>
                <option value="review_updated">Review Updated</option>
                <option value="rejected">Rejected</option>
                <option value="qualified_for_round1">
                  Qualified for Round 1
                </option>
                <option value="submit_presentation">Submit Presentation</option>
              </select>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={submitPresentationStatus}
                  className={primaryButtonClasses}
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelEditPresentationStatus}
                  className={secondaryButtonClasses}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {["review_pending", "update_needed", "review_updated"].includes(
                presentationStatus
              ) ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await supabase
                        .from("dat_presentation_links")
                        .update({ status: "qualified_for_round1" })
                        .eq("student_id", studentId);
                      setPresentationStatus("qualified_for_round1");
                    }}
                    className={primaryButtonClasses}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await supabase
                        .from("dat_presentation_links")
                        .update({ status: "rejected" })
                        .eq("student_id", studentId);
                      setPresentationStatus("rejected");
                    }}
                    className={secondaryButtonClasses}
                  >
                    Reject
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleEditPresentationStatus}
                  className={primaryButtonClasses}
                >
                  Change Status
                </Button>
              )}
            </div>
          )}
        </div>

        {/* New Final Status Section for Winner/Runner Up */}
        {presentationStatus === "qualified_for_round1" && (
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Round 1 Decision
            </h3>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => await updateFinalStatus("round1_winner")} // Changed from winner_selected
                className="bg-green-600 hover:bg-green-500 text-white transition-colors duration-200"
                disabled={disableWinner}
              >
                {disableWinner
                  ? "Winner Already Selected In This City"
                  : "Winner"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () =>
                  await updateFinalStatus("round1_runner_up")
                } // Changed from runner_up_selected
                className="bg-purple-600 hover:bg-purple-500 text-white transition-colors duration-200"
                disabled={disableRunnerUp}
              >
                {disableRunnerUp
                  ? "Runner Up Already Selected In This City"
                  : "Runner Up"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PresentationCard;
