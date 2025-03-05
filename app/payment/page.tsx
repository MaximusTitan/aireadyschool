"use client";

import YourBillingComponent from "./components/YourBillingComponent";

export default function Page() {
  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-center mb-8">AI Ready School Subscriptions</h1>
      <YourBillingComponent />
    </div>
  );
}
