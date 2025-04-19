import { CalendarDays, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { SubscriptionStatus } from "@/app/payment/subscription";
import ManageSubscription from "./ManageSubscription";

interface SubscriptionStatusCardProps {
  status: SubscriptionStatus;
  showManageButton?: boolean;
  className?: string;
}

export default function SubscriptionStatusCard({
  status,
  showManageButton = true,
  className = "",
}: SubscriptionStatusCardProps) {
  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // If no subscription, don't render anything
  if (!status.isSubscribed && !status.isTrialing) {
    return null;
  }

  return (
    <div
      className={`bg-white dark:bg-neutral-900 rounded-xl shadow-md p-6 ${className}`}
    >
      <div className="flex items-center justify-center mb-4">
        {status.isTrialing ? (
          <div className="flex items-center text-blue-600 dark:text-blue-400">
            <Clock className="h-5 w-5 mr-2" />
            <h3 className="font-medium">Trial Active</h3>
          </div>
        ) : status.isPastDue ? (
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
        {status.isTrialing && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="font-medium text-blue-700 dark:text-blue-300">
                Trial Period
              </span>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              Your trial ends on {formatDate(status.trialEndsAt)}
            </p>
            <p className="mt-2 text-xs text-blue-500 dark:text-blue-400">
              You won't be charged until your trial ends.
            </p>
          </div>
        )}

        {status.isPastDue && (
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
            {status.planName || "Creator"}
          </p>
          <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1">
            <span className="font-medium">Next billing date:</span>{" "}
            {formatDate(status.currentPeriodEnd)}
          </p>
        </div>

        {showManageButton && (
          <div className="mt-4 flex justify-center">
            <ManageSubscription />
          </div>
        )}
      </div>
    </div>
  );
}
