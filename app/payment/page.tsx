"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import SubscriptionPlan from "@/app/payment/components/SubscriptionPlan";
import {
  getSubscriptionStatus,
  SubscriptionStatus,
} from "@/app/payment/subscription";
import ManageSubscription from "@/app/payment/components/ManageSubscription";
import { CalendarDays, CheckCircle, AlertCircle, Clock } from "lucide-react";

// Replace with your actual Stripe publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const status = await getSubscriptionStatus();
        setSubscriptionStatus(status);
      } catch (error) {
        console.error("Error fetching subscription status:", error);
      } finally {
        setStatusLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, []);

  const subscriptionPlan = {
    id: "creator",
    name: "Creator",
    price: 20.0,
    interval: "month",
    features: [
      "Buddy Agent",
      "400k Words",
      "625 Total Images",
      "10 Total Videos",
      "Unlimited Text",
    ],
    priceId: "price_1RErN6E0IY2ji0N0OvBiZ5i8",
  };

  const handleSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: subscriptionPlan.priceId,
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      // Redirect to Stripe Checkout
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          console.error("Error redirecting to checkout:", error);
        }
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderSubscriptionStatus = () => {
    if (statusLoading) {
      return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-md p-6 mb-8 text-center">
          <p className="text-neutral-600 dark:text-neutral-400">
            Loading subscription status...
          </p>
        </div>
      );
    }

    if (!subscriptionStatus?.isSubscribed && !subscriptionStatus?.isTrialing) {
      return null; // No subscription status to show
    }

    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center justify-center mb-4">
          {subscriptionStatus.isTrialing ? (
            <div className="flex items-center text-blue-600 dark:text-blue-400">
              <Clock className="h-5 w-5 mr-2" />
              <h3 className="font-medium">Trial Active</h3>
            </div>
          ) : subscriptionStatus.isPastDue ? (
            <div className="flex items-center text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-5 w-5 mr-2" />
              <h3 className="font-medium">Payment Issue</h3>
            </div>
          ) : (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5 mr-2" />
              <h3 className="font-medium">Subscription Active</h3>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {subscriptionStatus.isTrialing && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  Trial Period
                </span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Your trial ends on {formatDate(subscriptionStatus.trialEndsAt)}
              </p>
              <p className="mt-2 text-xs text-blue-500 dark:text-blue-400">
                You won't be charged until your trial ends.
              </p>
            </div>
          )}

          {subscriptionStatus.isPastDue && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                There was an issue with your latest payment. Please update your
                payment method to avoid service interruption.
              </p>
            </div>
          )}

          <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg">
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              <span className="font-medium">Plan:</span>{" "}
              {subscriptionStatus.planName || "Creator"}
            </p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1">
              <span className="font-medium">Next billing date:</span>{" "}
              {formatDate(subscriptionStatus.currentPeriodEnd)}
            </p>
          </div>

          <div className="mt-4 flex justify-center">
            <ManageSubscription />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-backgroundApp bg-cover bg-center bg-no-repeat dark:bg-[radial-gradient(circle,rgba(30,0,10,0.3)_0%,rgba(55,0,20,0.3)_35%,rgba(30,0,10,0.3)_100%)] dark:bg-neutral-950">
      <div className="max-w-5xl mx-auto p-8">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold mb-4 text-neutral-950 dark:text-rose-100">
            AI Ready School Subscription
          </h1>
          <p className="text-neutral-600 dark:text-rose-200 max-w-2xl mx-auto">
            Subscribe now to unlock the full potential of AI tools for
            education.
          </p>
        </div>

        {/* Subscription Status */}
        {renderSubscriptionStatus()}

        {/* Only show subscription plan if not already subscribed */}
        {!subscriptionStatus?.isSubscribed &&
          !subscriptionStatus?.isTrialing && (
            <div className="flex justify-center mb-16">
              <div className="w-full max-w-md">
                <SubscriptionPlan
                  key={subscriptionPlan.id}
                  name={subscriptionPlan.name}
                  price={subscriptionPlan.price}
                  interval={subscriptionPlan.interval}
                  features={subscriptionPlan.features}
                  loading={loading}
                  onSubscribe={handleSubscription}
                  themeColor="rose-500"
                />
              </div>
            </div>
          )}

        <div className="mt-16 text-center text-sm text-rose-500 dark:text-rose-300">
          <p>
            Need help with your subscription? Contact our support team at
            support@aireadyschool.com
          </p>
        </div>
      </div>
    </div>
  );
}
