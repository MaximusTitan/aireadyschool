import Script from "next/script";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Check, Loader2 } from "lucide-react";

// Define Razorpay types
interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  name: string;
  currency: string;
  order_id: string;
  description: string;
  subscription_id: string; // Added subscription ID
  handler: (response: RazorpayResponse) => void;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (response: RazorpayErrorResponse) => void) => void;
}

interface RazorpayErrorResponse {
  error: {
    code: string;
    description: string;
  };
}

// Define subscription plan types
interface SubscriptionPlan {
  id: string;
  type: string;
  price: number;
  priceDisplay: string;
  credits: {
    videos: number;
    images: number;
    text: string;
  };
  features: string[];
}

// Subscription plans data
const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "student_plan",
    type: "Student",
    price: 99900,
    priceDisplay: "Rs.999.00 per month",
    credits: {
      videos: 25,
      images: 500,
      text: "Unlimited",
    },
    features: ["Access to all AI tools", "Priority support", "Cancel anytime"]
  },
  {
    id: "teacher_plan",
    type: "Teacher",
    price: 199900,
    priceDisplay: "Rs.1999.00 per month",
    credits: {
      videos: 50,
      images: 500,
      text: "Unlimited",
    },
    features: ["Access to all AI tools", "Priority support", "Cancel anytime", "Team collaboration"]
  },
];

// Extend Window interface to include Razorpay
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export default function YourBillingComponent() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        
        if (user) {
          const role = user.user_metadata.role;
          setUserRole(role);
          
          // Auto-select the plan matching the user's role
          const matchingPlan = subscriptionPlans.find(plan => 
            plan.type.toLowerCase() === role?.toLowerCase()
          );
          
          if (matchingPlan) {
            setSelectedPlan(matchingPlan);
          }
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Failed to load user data. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  const filteredPlans = userRole && (userRole === "Student" || userRole === "Teacher")
    ? subscriptionPlans.filter(plan => plan.type === userRole)
    : subscriptionPlans;

  const handlePaymentSuccess = async (response: RazorpayResponse) => {
    try {
      setIsProcessing(true);
      
      // Verify the payment on the server
      const result = await fetch("/api/razorpay/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...response,
          planId: selectedPlan?.id
        }),
      });
      
      const data = await result.json();
      
      if (data.success) {
        setIsSuccess(true);
        setSubscription(data.subscription);
      } else {
        throw new Error(data.error || "Payment verification failed");
      }
    } catch (error: any) {
      console.error("Payment verification error:", error);
      setError(error.message || "Failed to verify payment. Please contact support.");
    } finally {
      setIsProcessing(false);
    }
  };

  const makePayment = async () => {
    if (!selectedPlan) {
      alert("Please select a subscription plan");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      
      const response = await fetch("/api/razorpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId: selectedPlan.id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Network response was not ok");
      }
      
      const data = await response.json();
      const options = {
        name: "AI Ready School",
        currency: data.currency,
        order_id: data.id,
        description: `${selectedPlan.type} Subscription - ${selectedPlan.priceDisplay}`,
        subscription_id: "sub_Q4Bs57xSJdZvOY",
        handler: handlePaymentSuccess
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

      paymentObject.on("payment.failed", function (errorResponse: RazorpayErrorResponse) {
        setError("Payment failed. Please try again or contact support for help.");
        setIsProcessing(false);
      });
    } catch (error: any) {
      console.error("Error:", error);
      setError(error.message || "Payment initialization failed. Please try again.");
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-lg">Loading subscription plans...</p>
      </div>
    );
  }

  if (isSuccess && subscription) {
    return (
      <div className="bg-green-50 border-2 border-green-500 rounded-lg p-8 text-center max-w-md mx-auto">
        <div className="text-green-600 mb-4">
          <Check className="h-16 w-16 mx-auto" />
        </div>
        <h2 className="text-2xl font-semibold text-green-800 mb-4">Payment Successful!</h2>
        <p className="mb-6">Thank you for subscribing to the {selectedPlan?.type} plan.</p>
        <div className="text-left bg-white p-4 rounded-md mb-6 text-sm">
          <p><strong>Plan:</strong> {selectedPlan?.type}</p>
          <p><strong>Amount:</strong> {selectedPlan?.priceDisplay}</p>
          <p><strong>Valid until:</strong> {new Date(subscription.end_date).toLocaleDateString()}</p>
        </div>
        <button
          onClick={() => window.location.href = '/tools'}
          className="bg-rose-500 hover:bg-rose-600 text-white font-medium py-2 px-6 rounded-md transition-colors duration-300"
        >
          Explore AI Tools
        </button>
      </div>
    );
  }

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />

      <div className="space-y-8">
        <div className="max-w-2xl mx-auto text-center mb-8">
          <h2 className="text-2xl font-semibold mb-2">Choose Your Subscription Plan</h2>
          {userRole && (
            <p className="text-neutral-600 dark:text-neutral-400">
              Based on your {userRole} role, we've selected the most suitable plan for you.
            </p>
          )}
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 max-w-2xl mx-auto">
            <p>{error}</p>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row justify-center gap-8 mb-8">
          {filteredPlans.map((plan) => (
            <div 
              key={plan.id}
              className={`border-2 rounded-lg p-6 w-full md:w-[340px] cursor-pointer transition-all duration-300 
                hover:translate-y-[-5px] hover:shadow-lg relative
                ${selectedPlan?.id === plan.id 
                  ? 'border-rose-500 bg-gradient-to-br from-white to-rose-50 dark:from-neutral-900 dark:to-rose-900/20' 
                  : 'border-neutral-200 dark:border-neutral-800'}`}
              onClick={() => setSelectedPlan(plan)}
            >
              {selectedPlan?.id === plan.id && (
                <div className="absolute top-4 right-4 bg-rose-500 text-white p-1 rounded-full">
                  <Check className="h-4 w-4" />
                </div>
              )}
              
              <h3 className="text-xl font-bold mb-2">{plan.type} Plan</h3>
              <p className="text-2xl font-semibold mb-6">{plan.priceDisplay}</p>
              
              <div className="mb-6">
                <p className="font-semibold mb-2 text-neutral-800 dark:text-neutral-200">Free Credits Per Month:</p>
                <div className="space-y-1">
                  <p className="flex items-center gap-2">
                    <span className="w-24">Videos:</span> 
                    <span className="font-medium">{plan.credits.videos}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-24">Images:</span> 
                    <span className="font-medium">{plan.credits.images}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-24">Text:</span> 
                    <span className="font-medium">{plan.credits.text}</span>
                  </p>
                </div>
              </div>
              
              <div>
                <p className="font-semibold mb-2 text-neutral-800 dark:text-neutral-200">Features:</p>
                <ul className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <button
          className={`block w-full max-w-[320px] mx-auto py-4 px-6 rounded-md font-semibold text-white transition-all duration-300
            ${isProcessing ? 'bg-blue-400 cursor-wait' : 
              selectedPlan ? 'bg-rose-500 hover:bg-rose-600 hover:shadow-lg' : 'bg-neutral-400 cursor-not-allowed'}`}
          onClick={makePayment}
          disabled={!selectedPlan || isProcessing}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </span>
          ) : selectedPlan ? (
            `Subscribe to ${selectedPlan.type} Plan`
          ) : (
            'Select a Plan'
          )}
        </button>
      </div>
    </>
  );
}
