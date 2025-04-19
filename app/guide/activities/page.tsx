import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { categories } from "@/app/config/toolCategories";
import Link from "next/link";
import { activities } from "./activities";

// Utility function to find a tool by name across all categories and user types
const findToolRoute = (toolName: string): string | undefined => {
  for (const userType in categories) {
    for (const category in categories[userType]) {
      const tool = categories[userType][
        category as keyof (typeof categories)[typeof userType]
      ].find((tool) => tool.title === toolName);

      if (tool) {
        return tool.route;
      }
    }
  }
  return undefined;
};

const ActivitiesTable = () => {
  return (
    <div className="min-h-screen bg-backgroundApp py-6 px-4">
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-xl text-rose-500">Activities</CardTitle>
          <CardDescription className="text-sm text-gray-600">
            Available activities with platform tools
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium text-center w-12">
                    #
                  </TableHead>
                  <TableHead className="font-medium w-1/4">Activity</TableHead>
                  <TableHead className="font-medium w-2/5">Examples</TableHead>
                  <TableHead className="font-medium w-1/4">Tool(s)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((item, index) => (
                  <TableRow key={item.id} className="border-b">
                    <TableCell className="text-center text-gray-500">
                      {item.id}
                    </TableCell>
                    <TableCell>
                      {item.activity || (
                        <span className="text-gray-400 italic">
                          Not specified
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.examples.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-0.5 text-sm">
                          {item.examples.map((example, index) => (
                            <li key={index} className="text-gray-700">
                              {example}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400 italic">
                          Not specified
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.tools.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {item.tools.map((tool, index) => {
                            const toolRoute = findToolRoute(tool);
                            return toolRoute ? (
                              <Link key={index} href={toolRoute}>
                                <span className="inline-block px-2.5 py-1 text-xs border border-rose-200 hover:bg-rose-50 rounded-md text-rose-600 hover:text-rose-700 transition-colors cursor-pointer">
                                  {tool}
                                </span>
                              </Link>
                            ) : (
                              <span
                                key={index}
                                className="inline-block px-2.5 py-1 text-xs bg-gray-100 rounded-md text-gray-700"
                              >
                                {tool}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">
                          Not specified
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivitiesTable;
