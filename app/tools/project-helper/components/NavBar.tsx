"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function NavBar() {
  return (
    <nav className="bg-white">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2 py-4">
            <Link href="/tools">
              <ChevronLeft className="h-6 w-6 text-gray-600 dark:text-gray-400 cursor-pointer" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              Project Helper
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/tools/project-helper/saved-texts">
              <Button variant="outline">View Saved Texts</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
