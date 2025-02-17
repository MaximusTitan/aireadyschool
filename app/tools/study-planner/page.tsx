"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AIStudyPlanner } from "./components/ai-study-planner";

export default function Page() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
      <Link href="/tools">
        <Button variant="outline" className="mb-2 border-neutral-500">
          ← Back
        </Button>
      </Link>

      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold text-rose-500">
          Study Plan Generator
        </h1>
        <p className="text-muted-foreground text-lg">
          Plan and organize students study schedule efficiently with customized
          recommendations on focus subjects and topics to improve.
        </p>
      </div>

      <AIStudyPlanner />
    </div>
  );
}
