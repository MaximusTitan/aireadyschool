"use client";

// import YourBillingComponent from "./components/YourBillingComponent";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#f7f3f2] bg-cover bg-center bg-no-repeat dark:bg-[radial-gradient(circle,rgba(0,0,0,0.3)_0%,rgba(55,0,20,0.3)_35%,rgba(0,0,0,0.3)_100%)] dark:bg-neutral-950">
      <div className="max-w-5xl mx-auto p-8">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold mb-4 text-neutral-950 dark:text-neutral-100">
            AI Ready School Subscriptions
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Choose a subscription plan that fits your needs and unlock the full
            potential of AI tools for education.
          </p>
        </div>

        {/* <YourBillingComponent /> */}

        <div className="mt-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
          <p>
            Need help choosing a plan? Contact our support team at
            support@aireadyschool.com
          </p>
        </div>
      </div>
    </div>
  );
}
