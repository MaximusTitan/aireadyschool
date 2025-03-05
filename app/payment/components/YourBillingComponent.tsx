import Script from "next/script";
import { useState } from "react";

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
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
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
}

// Subscription plans data
const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "student_plan",
    type: "Student",
    price: 999, // in paise (Rs.999)
    priceDisplay: "Rs.999 per month",
    credits: {
      videos: 25,
      images: 500,
      text: "Unlimited",
    },
  },
  {
    id: "teacher_plan",
    type: "Teacher",
    price: 999, // in paise (Rs.1999)
    priceDisplay: "Rs.1999 per month",
    credits: {
      videos: 50,
      images: 500,
      text: "Unlimited",
    },
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

  const makePayment = async () => {
    if (!selectedPlan) {
      alert("Please select a subscription plan");
      return;
    }

    try {
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
        subscription_id: "sub_Q3795vK12jCO5m", // Added subscription ID
        handler: function (response: RazorpayResponse) {
          // Validate payment at server - using webhooks is a better idea.
          alert(`Payment successful! Welcome to ${selectedPlan.type} plan.`);
        },
        prefill: {
          name: "John Doe",
          email: "jdoe@example.com",
          contact: "9876543210",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

      paymentObject.on("payment.failed", function (errorResponse: RazorpayErrorResponse) {
        alert("Payment failed. Please try again. Contact support for help");
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Payment initialization failed. Please try again.");
    }
  };

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />

      <div className="space-y-8">
        <h2 className="text-2xl font-semibold text-center mb-8">Choose Your Subscription Plan</h2>
        
        <div className="flex flex-col md:flex-row justify-center gap-8 mb-8">
          {subscriptionPlans.map((plan) => (
            <div 
              key={plan.id}
              className={`border-2 rounded-lg p-6 w-full md:w-[300px] cursor-pointer transition-all duration-300 
                hover:translate-y-[-5px] hover:shadow-lg 
                ${selectedPlan?.id === plan.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => setSelectedPlan(plan)}
            >
              <h3 className="text-xl font-bold mb-4">{plan.type} Plan</h3>
              <p className="text-lg font-semibold mb-4">{plan.priceDisplay}</p>
              <div>
                <p className="font-semibold mb-2">Free Credits Per Month:</p>
                <ul className="list-disc pl-6">
                  <li>{plan.credits.videos} Videos</li>
                  <li>{plan.credits.images} Images</li>
                  <li>{plan.credits.text} Text</li>
                </ul>
              </div>
            </div>
          ))}
        </div>

        <button
          className={`block w-full max-w-[300px] mx-auto py-4 px-6 rounded-md font-semibold text-white transition-colors duration-300
            ${selectedPlan 
              ? 'bg-blue-500 hover:bg-blue-600' 
              : 'bg-gray-400 cursor-not-allowed'}`}
          onClick={makePayment}
          disabled={!selectedPlan}
        >
          {selectedPlan ? `Subscribe to ${selectedPlan.type} Plan` : 'Select a Plan'}
        </button>
      </div>
    </>
  );
}
