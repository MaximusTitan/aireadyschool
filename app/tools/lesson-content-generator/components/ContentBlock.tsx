"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface ContentBlockProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function ContentBlock({
  title,
  description,
  children,
}: ContentBlockProps) {
  return (
    <Card className="content-block">
      <CardHeader className="flex justify-center">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {children}
    </Card>
  );
}
