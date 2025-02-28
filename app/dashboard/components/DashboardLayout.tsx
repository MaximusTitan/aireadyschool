"use client";

import React, { ReactNode, useState, useEffect } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export default function DashboardLayout({
  children,
  title,
}: DashboardLayoutProps) {
  const [formattedDate, setFormattedDate] = useState<string>("2023-02-01");

  useEffect(() => {
    // Update date on client side only
    const date = new Date();
    setFormattedDate(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    );
  }, []);

  return (
    <div className="bg-backgroundApp min-h-screen">
    <div className="container mx-auto px-3 py-6 max-w-8xl">
      <h1 className="text-2xl font-medium mb-4 text-rose-500 border-b pb-2">
        {title}
      </h1>
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        {children}
      </div>
      <div className="text-center text-gray-400 text-xs mt-6">
        <p>© 2023 AI Ready School • Last updated: {formattedDate}</p>
      </div>
    </div>
    </div>
  );
}
