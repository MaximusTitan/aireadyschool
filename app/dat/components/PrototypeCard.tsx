import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/app/dat/utils/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpandableSuggestions } from "./ExpandableSuggestions";

// New type for prototype status similar to presentation status
export type PrototypeStatus =
  | "not_submitted"
  | "review_pending"
  | "update_needed"
  | "review_updated"
  | "rejected"
  | "qualified_for_round2"
  | "round2_winner"
  | "round2_runner_up"
  | "finals_winner"
  | "finals_runner_up";

interface Prototype {
  prototype_link: string;
  status: PrototypeStatus;
  created_at: string;
  admin_suggestions?: string;
  updated?: boolean;
}

interface PrototypeCardProps {
  prototype: Prototype | null;
  editingPrototypeStatus: boolean;
  setEditingPrototypeStatus: (value: React.SetStateAction<boolean>) => void;
  prototypeTempStatus: PrototypeStatus;
  setPrototypeTempStatus: (
    value: React.SetStateAction<PrototypeStatus>
  ) => void;
  submitPrototypeStatus: () => Promise<void>;
  cancelEditPrototypeStatus: () => void;
  handleCopyPrototypeLink: () => void;
  copyPrototypeSuccess: boolean;
  studentId: string;
  setPrototype: React.Dispatch<React.SetStateAction<Prototype | null>>; // Updated type
  admin_suggestions?: string;
  submitSuggestion: (suggestion: string) => Promise<void>;
  disableWinner?: boolean; // New prop to disable Winner button
  disableRunnerUp?: boolean; // New prop to disable Runner Up button
  disableFinalsWinner?: boolean; // New prop to disable Finals Winner button
  disableFinalsRunnerUp?: boolean; // New prop to disable Finals Runner Up button
}

const PrototypeCard: React.FC<PrototypeCardProps> = ({
  prototype,
  editingPrototypeStatus,
  setEditingPrototypeStatus,
  prototypeTempStatus,
  setPrototypeTempStatus,
  submitPrototypeStatus,
  cancelEditPrototypeStatus,
  handleCopyPrototypeLink,
  copyPrototypeSuccess,
  studentId,
  setPrototype,
  submitSuggestion,
  admin_suggestions,
  disableWinner = false,
  disableRunnerUp = false,
  disableFinalsWinner = false,
  disableFinalsRunnerUp = false,
}) => {
  const [suggestion, setSuggestion] = useState("");
  const [localAdminSuggestions, setLocalAdminSuggestions] =
    useState(admin_suggestions);

  const getStatusColor = (status: PrototypeStatus | undefined) => {
    switch (status) {
      case "qualified_for_round2":
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
      case "round2_winner":
        return {
          bg: "bg-indigo-50",
          text: "text-indigo-700",
          border: "border-indigo-200",
          icon: "🏆",
        };
      case "round2_runner_up":
        return {
          bg: "bg-teal-50",
          text: "text-teal-700",
          border: "border-teal-200",
          icon: "🥈",
        };
      case "finals_winner":
        return {
          bg: "bg-gold-50",
          text: "text-gold-700",
          border: "border-gold-200",
          icon: "🏆",
        };
      case "finals_runner_up":
        return {
          bg: "bg-silver-50",
          text: "text-silver-700",
          border: "border-silver-200",
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

  const primaryButtonClasses =
    "bg-rose-600 hover:bg-rose-500 text-white transition-colors duration-200";
  const secondaryButtonClasses =
    "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 transition-colors duration-200";

  if (!prototype) {
    return (
      <Card className="mt-6 shadow opacity-75">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Prototype
            </CardTitle>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              Not Submitted
            </span>
          </div>
        </CardHeader>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <p>Student hasn&apos;t submitted a prototype yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSaveSuggestion = async () => {
    if (!suggestion.trim()) return;

    const newSuggestion = localAdminSuggestions
      ? `${localAdminSuggestions}\n\nNew Suggestion (${new Date().toLocaleDateString()}):\n${suggestion}`
      : `New Suggestion (${new Date().toLocaleDateString()}):\n${suggestion}`;

    try {
      const { error } = await supabase
        .from("dat_prototype_links")
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
        alert("Failed to save suggestion");
        return;
      }

      // Update local state immediately
      setLocalAdminSuggestions(newSuggestion);
      setSuggestion("");

      // Update prototype state
      if (prototype) {
        setPrototype({
          ...prototype,
          admin_suggestions: newSuggestion,
          status: "update_needed",
          updated: false,
        });
      }

      await submitSuggestion(newSuggestion);
    } catch (error) {
      console.error("Error in handleSaveSuggestion:", error);
      alert("Failed to save suggestion");
    }
  };

  // New function: Update final prototype status based on winner/runner-up action
  const updateFinalStatus = async (newStatus: PrototypeStatus) => {
    const { error } = await supabase
      .from("dat_prototype_links")
      .update({ status: newStatus })
      .eq("student_id", studentId);
    if (!error && prototype) {
      setPrototype({
        ...prototype,
        status: newStatus,
      });
    }
  };

  // New function: Update finals status based on winner/runner-up action
  const updateFinalsStatus = async (newStatus: PrototypeStatus) => {
    const { error } = await supabase
      .from("dat_prototype_links")
      .update({ status: newStatus })
      .eq("student_id", studentId);
    if (!error && prototype) {
      setPrototype({
        ...prototype,
        status: newStatus,
      });
    }
  };

  // Add new function for managing finals status changes
  const updateFinalsManagementStatus = async (newStatus: PrototypeStatus) => {
    const { error } = await supabase
      .from("dat_prototype_links")
      .update({ status: newStatus })
      .eq("student_id", studentId);
    if (!error && prototype) {
      setPrototype({
        ...prototype,
        status: newStatus,
      });
    }
  };

  const getDisplayStatus = (status: PrototypeStatus | undefined) => {
    // For the status badge, only show up to Round 2 statuses
    switch (status) {
      case "finals_winner":
      case "finals_runner_up":
        // If it's a finals status, show their Round 2 achievement instead
        return status === "finals_winner"
          ? "round2_winner"
          : "round2_runner_up";
      default:
        return status;
    }
  };

  return (
    <Card className="mt-6 shadow-md rounded-xl">
      <CardHeader className="border-b pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Prototype
              {prototype?.created_at && (
                <p className="text-sm text-gray-500">
                  Submitted on{" "}
                  {new Date(prototype.created_at).toLocaleDateString()}
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
            onClick={() =>
              prototype && window.open(prototype.prototype_link, "_blank")
            }
            className={primaryButtonClasses}
          >
            View Prototype
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPrototypeLink}
            className={secondaryButtonClasses}
          >
            {copyPrototypeSuccess ? "Link Copied!" : "Copy Link"}
          </Button>
        </div>

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

        {/* Status Control Section - Modified to show only Round 2 status */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">
              Status Control
            </h3>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                getStatusColor(getDisplayStatus(prototype?.status)).bg
              } ${getStatusColor(getDisplayStatus(prototype?.status)).text} border ${
                getStatusColor(getDisplayStatus(prototype?.status)).border
              }`}
            >
              <span className="mr-1">
                {getStatusColor(getDisplayStatus(prototype?.status)).icon}
              </span>
              {(() => {
                const status = getDisplayStatus(prototype?.status);
                return status
                  ? status.charAt(0).toUpperCase() +
                      status.slice(1).replace(/_/g, " ")
                  : "Not Submitted";
              })()}
            </div>
          </div>

          {editingPrototypeStatus ? (
            <div className="flex items-center gap-2">
              <select
                value={prototypeTempStatus}
                onChange={(e) =>
                  setPrototypeTempStatus(e.target.value as PrototypeStatus)
                }
                className="text-sm border rounded-md py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
                style={{ backgroundColor: "#F7F1EF" }}
              >
                <option value="not_submitted">Not Submitted</option>
                <option value="review_pending">Review Pending</option>
                <option value="update_needed">Update Needed</option>
                <option value="review_updated">Review Updated</option>
                <option value="qualified_for_round2">
                  Qualified for Round 2
                </option>
              </select>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={submitPrototypeStatus}
                  className={primaryButtonClasses}
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelEditPrototypeStatus}
                  className={secondaryButtonClasses}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {["review_pending", "update_needed", "review_updated"].includes(
                prototype?.status || ""
              ) ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await supabase
                        .from("dat_prototype_links")
                        .update({ status: "qualified_for_round2" })
                        .eq("student_id", studentId);
                      setPrototype((prev) =>
                        prev
                          ? { ...prev, status: "qualified_for_round2" }
                          : null
                      );
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
                        .from("dat_prototype_links")
                        .update({ status: "rejected" })
                        .eq("student_id", studentId);
                      setPrototype((prev) =>
                        prev ? { ...prev, status: "rejected" } : null
                      );
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
                  onClick={() => {
                    setPrototypeTempStatus(
                      prototype?.status || "not_submitted"
                    );
                    setEditingPrototypeStatus(true);
                  }}
                  className={primaryButtonClasses}
                >
                  Change Status
                </Button>
              )}
            </div>
          )}
        </div>

        {/* New Round 2 Decision Section for Winner/Runner Up */}
        {prototype?.status === "qualified_for_round2" && (
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Round 2 Decision
            </h3>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => await updateFinalStatus("round2_winner")}
                className="bg-green-600 hover:bg-green-500 text-white transition-colors duration-200"
                disabled={disableWinner}
              >
                {disableWinner ? "Winner Already Selected" : "Winner"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () =>
                  await updateFinalStatus("round2_runner_up")
                }
                className="bg-purple-600 hover:bg-purple-500 text-white transition-colors duration-200"
                disabled={disableRunnerUp}
              >
                {disableRunnerUp ? "Runner Up Already Selected" : "Runner Up"}
              </Button>
            </div>
          </div>
        )}

        {/* New Finals Decision Section for Winner/Runner Up */}
        {(prototype?.status === "round2_winner" ||
          prototype?.status === "round2_runner_up") && (
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Finals Decision (Round 3)
            </h3>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => await updateFinalsStatus("finals_winner")}
                className="bg-yellow-600 hover:bg-yellow-500 text-white transition-colors duration-200"
                disabled={disableFinalsWinner}
              >
                {disableFinalsWinner
                  ? "Finals Winner Already Selected For This Group"
                  : "Finals Winner"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () =>
                  await updateFinalsStatus("finals_runner_up")
                }
                className="bg-gray-600 hover:bg-gray-500 text-white transition-colors duration-200"
                disabled={disableFinalsRunnerUp}
              >
                {disableFinalsRunnerUp
                  ? "Finals Runner Up Already Selected For This Group"
                  : "Finals Runner Up"}
              </Button>
            </div>
          </div>
        )}

        {/* Add new Finals Management Section */}
        {(prototype?.status === "finals_winner" ||
          prototype?.status === "finals_runner_up") && (
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">
                Finals Status Management
              </h3>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  prototype.status === "finals_winner"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-silver-100 text-gray-800"
                }`}
              >
                {prototype.status === "finals_winner"
                  ? "Finals Winner 🏆"
                  : "Finals Runner Up 🥈"}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={prototype.status}
                onChange={(e) =>
                  updateFinalsManagementStatus(
                    e.target.value as PrototypeStatus
                  )
                }
                className="text-sm border rounded-md py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
                style={{ backgroundColor: "#F7F1EF" }}
              >
                <option value="finals_winner">Finals Winner</option>
                <option value="finals_runner_up">Finals Runner Up</option>
                <option value="round2_winner">Revert to Round 2 Winner</option>
                <option value="round2_runner_up">
                  Revert to Round 2 Runner Up
                </option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFinalsManagementStatus(prototype.status)}
                className="bg-rose-600 hover:bg-rose-500 text-white transition-colors duration-200"
              >
                Update Finals Status
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrototypeCard;
