"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RecommendationsPanelProps {
  recommendations: string[];
  focusAreas: string[];
  strengthAreas: string[];
}

export function RecommendationsPanel({
  recommendations,
  focusAreas,
  strengthAreas,
}: RecommendationsPanelProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recommended Interventions</CardTitle>
          <CardDescription>
            Suggested teaching strategies based on assessment analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {recommendations.map((recommendation, index) => (
              <li
                key={index}
                className="pb-3 border-b last:border-b-0 last:pb-0"
              >
                <div className="flex items-start gap-2">
                  <div className="bg-rose-100 text-rose-500 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-sm">{recommendation}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recommended Focus Areas</CardTitle>
            <CardDescription>
              Areas that need additional attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {focusAreas.map((area, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-rose-50 text-rose-500 border-rose-200"
                >
                  {area}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Strength Areas to Build Upon</CardTitle>
            <CardDescription>
              Areas of strength that can be leveraged
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {strengthAreas.map((area, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-green-50 text-green-500 border-green-200"
                >
                  {area}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
