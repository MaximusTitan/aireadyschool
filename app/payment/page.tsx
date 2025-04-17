"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import SubscriptionPlan from "@/app/payment/components/SubscriptionPlan";

// Replace with your actual Stripe publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

export default function Page() {
  const [loading, setLoading] = useState(false);

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

        {/* Centered Subscription Plan */}
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
