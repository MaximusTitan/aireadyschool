import React from "react";
import { Check } from "lucide-react";

interface SubscriptionPlanProps {
  name: string;
  price: number;
  interval: string;
  features: string[];
  popular?: boolean;
  loading?: boolean;
  onSubscribe: () => void;
  themeColor?: string;
}

export default function SubscriptionPlan({
  name,
  price,
  interval,
  features,
  popular = false,
  loading = false,
  onSubscribe,
  themeColor = "blue-500",
}: SubscriptionPlanProps) {
  return (
    <div
      className={`
                bg-white dark:bg-neutral-900 rounded-xl shadow-lg overflow-hidden
                border border-neutral-200 dark:border-neutral-700
                transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
                ${popular ? "ring-2 ring-rose-400 ring-opacity-50" : ""}
            `}
    >
      {popular && (
        <div className="bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-200 py-1 text-center text-sm font-medium">
          Most Popular
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
          {name}
        </h3>
        <div className="mt-4 flex items-baseline">
          <span className="text-3xl font-bold text-neutral-900 dark:text-white">
            ${price}
          </span>
          <span className="ml-1 text-neutral-600 dark:text-neutral-400">
            /{interval}
          </span>
        </div>
        <ul className="mt-6 space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {feature}
              </span>
            </li>
          ))}
        </ul>
        <button
          onClick={onSubscribe}
          disabled={loading}
          className={`
                mt-8 w-full rounded-md py-2 px-4 font-medium
                bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-400
                focus:outline-none focus:ring-2 focus:ring-offset-2
                transition-all duration-200
                disabled:opacity-75 disabled:cursor-not-allowed
            `}
        >
          {loading ? "Processing..." : `Subscribe to ${name}`}
        </button>
      </div>
    </div>
  );
}
