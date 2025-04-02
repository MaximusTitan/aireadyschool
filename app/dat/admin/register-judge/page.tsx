import JudgeForm from "../../components/forms/JudgeForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function RegisterJudgePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-8">
          <Link href="/dat/admin" className="mr-4">
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4 mr-2" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-rose-600">
              Register New Judge
            </h1>
            <p className="text-gray-600">
              Create a new judge account for the competition
            </p>
          </div>
        </div>

        <JudgeForm />
      </div>
    </div>
  );
}
