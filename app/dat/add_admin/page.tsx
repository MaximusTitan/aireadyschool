"use client";

import React, { Suspense } from "react";
import { Button } from "@/components/ui/button";
import AdminForm from "../components/forms/AdminForm";

export default function AdminPage() {
  return (
    <Suspense fallback={<p>Loading page...</p>}>
      <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
        <div className="container mx-auto p-6">
          <div className="mb-8 flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
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
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-rose-600">
                Admin Registration
              </h1>
              <p className="text-gray-600">
                Add a new admin account for Data&AI Talks
              </p>
            </div>
          </div>
          <div className="max-w-xl mx-auto">
            {" "}
            {/* Added max-width container */}
            <AdminForm />
          </div>
        </div>
      </div>
    </Suspense>
  );
}
