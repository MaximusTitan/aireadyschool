"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ArrowRight, CalendarDays } from "lucide-react";

// Define proper types for subscription
interface StripeSubscription {
  id: string;
  status: string;
  trial_end: number | null;
  current_period_end: number | null;
  [key: string]: any; // for any other properties
}

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<StripeSubscription | null>(
    null
  );

  useEffect(() => {
    if (sessionId) {
      // Verify the subscription on the server side
      fetch(`/api/verify-subscription?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          setSubscription(data.subscription);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error verifying subscription:", err);
          setLoading(false);
        });
    }
  }, [sessionId]);

  // Format date for display
  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Check if subscription is in trial period
  const isTrialing = subscription?.status === "trialing";

  return (
    <div className="min-h-screen bg-backgroundApp bg-cover bg-center dark:bg-neutral-950 flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>

        <h1 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-white">
          {isTrialing
            ? "Trial Started Successfully!"
            : "Subscription Successful!"}
        </h1>

        {loading ? (
          <p className="text-neutral-600 dark:text-neutral-400">
            Verifying your subscription...
          </p>
        ) : subscription ? (
          <div className="space-y-4">
            <p className="text-neutral-600 dark:text-neutral-400">
              {isTrialing
                ? "Your free trial of AI Ready School has been activated."
                : "Thank you for subscribing to AI Ready School. Your account has been activated."}
            </p>

            {isTrialing && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex flex-col items-center">
                <div className="flex items-center mb-2">
                  <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="font-medium text-blue-700 dark:text-blue-300">
                    Trial Period
                  </span>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  Your trial ends on {formatDate(subscription.trial_end)}
                </p>
                <p className="mt-2 text-xs text-blue-500 dark:text-blue-400">
                  You won't be charged until your trial ends.
                </p>
              </div>
            )}

            <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                You now have access to all features included in your
                subscription plan.
              </p>
              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                {isTrialing
                  ? `When your trial ends, you'll be billed $20/month.`
                  : `Your next billing date is ${formatDate(subscription.current_period_end)}`}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-amber-600 dark:text-amber-400">
            We received your payment, but there was an issue activating your
            subscription. Our team has been notified and will assist you
            shortly.
          </p>
        )}

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-5 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            Go to dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
