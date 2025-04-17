"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Book, CheckCircle } from "lucide-react";

interface Module {
  id: number;
  title: string;
  description: string;
  progress: number;
  completed: boolean;
}

interface ModulesListProps {
  modules: Module[];
  languageName: string;
}

export default function ModulesList({ modules, languageName }: ModulesListProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Learning {languageName}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {modules.map((module) => (
            <Card
              key={module.id}
              className="p-6 hover:scale-105 transition-transform cursor-pointer bg-white/50 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Book className="h-5 w-5 text-blue-500" />
                  <h3 className="font-bold">{module.title}</h3>
                </div>
                {module.completed && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {module.description}
              </p>
              <Progress value={module.progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2 text-right">
                {module.progress}% complete
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}