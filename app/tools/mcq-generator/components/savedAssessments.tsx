import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Assessment {
  id: string;
  board?: string;
  class_level: string;
  subject: string;
  topic: string;
  assessment_type: string;
  difficulty: string;
  questions: any[];
  answers?: any[];
  learning_outcomes?: string[];
  created_at: string;
}

interface SavedAssessmentsProps {
  savedAssessments: Assessment[];
  handleLoadAssessment: (id: string) => Promise<void>;
  handleViewAnswers: (id: string) => Promise<void>;
}

export default function SavedAssessments({
  savedAssessments,
  handleLoadAssessment,
  handleViewAnswers,
}: SavedAssessmentsProps) {
  if (savedAssessments.length === 0) return null;

  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="bg-muted/50 border-b">
        <CardTitle className="text-2xl font-bold">
          Saved Assessments
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="relative w-full overflow-auto max-h-[400px] scrollbar-thin">
          <style>{`
          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .scrollbar-thin::-webkit-scrollbar-track {
            background: transparent;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background-color: rgba(0, 0, 0, 0.1);
            border-radius: 3px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background-color: rgba(0, 0, 0, 0.2);
          }
          .dark .scrollbar-thin::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.1);
          }
          .dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background-color: rgba(255, 255, 255, 0.2);
          }
        `}</style>
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted sticky top-0 bg-white dark:bg-gray-950">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Board
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-1/4">
                  Title
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Grade
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Subject
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Type
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Date
                </th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {savedAssessments.map((assessment) => (
                <tr
                  key={assessment.id}
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  <td className="p-4 align-middle">{assessment.board}</td>
                  <td className="p-4 align-middle truncate max-w-[200px]">
                    {assessment.topic}
                  </td>
                  <td className="p-4 align-middle">
                    {assessment.class_level}
                  </td>
                  <td className="p-4 align-middle">
                    {assessment.subject}
                  </td>
                  <td className="p-4 align-middle capitalize">
                    {assessment.assessment_type}
                  </td>
                  <td className="p-4 align-middle">
                    {new Date(assessment.created_at).toLocaleDateString(
                      "en-GB",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                      }
                    )}
                  </td>
                  <td className="p-4 align-middle text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => handleLoadAssessment(assessment.id)}
                        variant="ghost"
                        size="icon"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-pencil"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        onClick={() => handleViewAnswers(assessment.id)}
                        variant="ghost"
                        size="icon"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-eye"
                        >
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span className="sr-only">View Answers</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
