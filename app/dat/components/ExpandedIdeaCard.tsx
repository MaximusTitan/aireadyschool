import React, { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Pencil, Brain } from "lucide-react";
import { ExpandableSuggestions } from "./ExpandableSuggestions";

interface IdeaType {
  id?: string;
  title?: string; // now optional
  brief_description?: string;
  why_this_idea?: string;
  how_get_this_idea?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'needs_update';
  created_at?: string;
  admin_suggestions?: string;
}

interface ExpandedIdeaCardProps {
  submittedIdea: IdeaType;
  onUpdateIdea: (idea: IdeaType) => Promise<void>;
  onNotifyIdeaChanges: (ideaId: string) => Promise<void>;
  onSubmitSuggestion: (ideaId: string, suggestion: string) => Promise<void>;
}

const ExpandedIdeaCard: React.FC<ExpandedIdeaCardProps> = ({
  submittedIdea,
  onUpdateIdea,
  onNotifyIdeaChanges,
  onSubmitSuggestion,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [idea, setIdea] = useState<IdeaType>(submittedIdea);
  const [suggestion, setSuggestion] = useState("");

  const toggleExpanded = () => setExpanded((prev) => !prev);

  const handleEditClick = () => {
    setIdea(submittedIdea);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    await onUpdateIdea(idea);
    setIsEditing(false);
  };

  const handleNotify = async () => {
    if (submittedIdea.id) {
      await onNotifyIdeaChanges(submittedIdea.id);
    }
  };

  const handleSaveSuggestion = async () => {
    const combined = submittedIdea.admin_suggestions 
      ? `${submittedIdea.admin_suggestions}\n\nNew Suggestion (${new Date().toLocaleDateString()}):\n${suggestion}`
      : suggestion;
    if (submittedIdea.id) {
      await onSubmitSuggestion(submittedIdea.id, combined);
      setSuggestion("");
    }
  };

  return (
    <div onClick={toggleExpanded} className="cursor-pointer">
      <Card className="border-2 border-rose-100 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-rose-500" />
              <h2 className="text-2xl font-semibold text-rose-600">Your Idea</h2>
            </div>
            {!isEditing && (
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick();
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4" onClick={(e) => e.stopPropagation()}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={idea.title}
                  onChange={(e) => setIdea({ ...idea, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Brief Description</label>
                <textarea
                  value={idea.brief_description}
                  onChange={(e) => setIdea({ ...idea, brief_description: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  required
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Why This Idea?</label>
                <textarea
                  value={idea.why_this_idea}
                  onChange={(e) => setIdea({ ...idea, why_this_idea: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  required
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">How Did You Get This Idea?</label>
                <textarea
                  value={idea.how_get_this_idea}
                  onChange={(e) => setIdea({ ...idea, how_get_this_idea: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  required
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-4">
                <Button type="submit" className="bg-rose-600 text-white hover:bg-rose-500 transition-colors duration-200">
                  Save
                </Button>
                <Button 
                  onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Title</h3>
                <p className="mt-1 text-lg">{submittedIdea.title}</p>
              </div>
              {expanded && (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Brief Description</h3>
                    <p className="mt-1 text-lg">{submittedIdea.brief_description}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Why This Idea?</h3>
                    <p className="mt-1 text-lg">{submittedIdea.why_this_idea}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">How Did You Get This Idea?</h3>
                    <p className="mt-1 text-lg">{submittedIdea.how_get_this_idea}</p>
                  </div>
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Admin Suggestions</h3>
                    {submittedIdea.admin_suggestions ? (
                      <ExpandableSuggestions suggestions={submittedIdea.admin_suggestions} />
                    ) : (
                      <p className="text-gray-600 text-sm">No suggestions yet.</p>
                    )}
                    <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Add New Suggestion:</label>
                      <textarea
                        value={suggestion}
                        onChange={(e) => setSuggestion(e.target.value)}
                        className="border rounded-md p-2 w-full"
                        rows={3}
                        placeholder="Type your suggestion here..."
                      />
                      <Button 
                        onClick={handleSaveSuggestion} 
                        variant="outline" 
                        size="sm"
                        disabled={!suggestion.trim()}
                        className="mt-2 bg-rose-600 text-white hover:bg-rose-500 transition-colors duration-200"
                      >
                        Save Suggestion
                      </Button>
                    </div>
                    <div className="mt-4">
                      <Button 
                        onClick={(e) => { e.stopPropagation(); handleNotify(); }} 
                        variant="outline"
                        className="bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
                      >
                        I have updated the idea
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpandedIdeaCard;
