import React from "react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Activity {
  name: string;
  duration: string;
  instructions: string;
}

interface LessonPlanSection {
  name: string;
  duration: string;
  activities?: Activity[];
  keyPoints?: string[];
  description?: string;
  steps?: string[];
  methods?: string[];
}

interface LessonPlan {
  topic: string;
  objective: string;
  duration: string;
  gradeLevel: string;
  subject: string;
  sections: LessonPlanSection[];
  resources: string[];
}

interface DynamicLessonPlanTableProps {
  lessonPlan: LessonPlan;
}

const ActivitySection: React.FC<{ activities?: Activity[] }> = ({
  activities,
}) => {
  if (!activities || activities.length === 0) return null;

  return (
    <div className="mt-2">
      <h4 className="font-semibold">Activities:</h4>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="pl-5 border-l-2 border-rose-200 my-2">
            <h5 className="font-medium text-rose-600">{activity.name}</h5>
            <p className="text-sm text-muted-foreground">
              Duration: {activity.duration}
            </p>
            <p className="mt-1">{activity.instructions}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ListSection: React.FC<{ title: string; items?: string[] }> = ({
  title,
  items,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-2">
      <h4 className="font-semibold">{title}:</h4>
      <ul className="list-disc pl-5 space-y-1">
        {items.map((item, index) => (
          <li key={index} className="text-muted-foreground">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export function DynamicLessonPlanTable({
  lessonPlan,
}: DynamicLessonPlanTableProps) {
  return (
    <div className="space-y-8">
      <Table>
        <TableBody>
          {[
            { label: "Topic", value: lessonPlan.topic },
            { label: "Objective", value: lessonPlan.objective },
            { label: "Duration", value: lessonPlan.duration },
            { label: "Grade Level", value: lessonPlan.gradeLevel },
            { label: "Subject", value: lessonPlan.subject },
          ].map(({ label, value }, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{label}</TableCell>
              <TableCell>{value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {lessonPlan.sections.map((section, index) => (
        <Card key={index} className="border-rose-100">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{section.name}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {section.duration}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ActivitySection activities={section.activities} />
            <ListSection title="Key Points" items={section.keyPoints} />
            {section.description && (
              <div className="space-y-2">
                <h4 className="font-semibold">Description:</h4>
                <p className="text-muted-foreground">{section.description}</p>
              </div>
            )}
            {section.steps && section.steps.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Steps:</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  {section.steps.map((step, i) => (
                    <li key={i} className="text-muted-foreground">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <ListSection title="Methods" items={section.methods} />
          </CardContent>
        </Card>
      ))}

      {lessonPlan.resources && lessonPlan.resources.length > 0 && (
        <Card className="border-rose-100">
          <CardHeader>
            <CardTitle>Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {lessonPlan.resources.map((resource, index) => {
                const [title, url] = resource.split(" - ");
                return (
                  <li key={index}>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-500 hover:underline"
                      >
                        {title}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">{resource}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
