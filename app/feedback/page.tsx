import { Suspense } from "react";
import SuggestFeatureForm from "./suggest-feature-form";
import FeedbackList from "./feedback-list";

export default function FeedbackPage() {
  return (
    <div className="bg-rose-50/25 min-h-screen w-full">
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:sticky md:top-6 h-fit">
            <SuggestFeatureForm />
          </div>
          <div>
            <Suspense fallback={<div>Loading feedback...</div>}>
              <FeedbackList />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
