import Razorpay from "razorpay";
import { generate as shortidGenerate } from "shortid";
import { NextRequest } from "next/server";

// Check if environment variables are defined
const RAZORPAY_ID = process.env.RAZORPAY_ID;
const RAZORPAY_KEY = process.env.RAZORPAY_KEY;

if (!RAZORPAY_ID || !RAZORPAY_KEY) {
  throw new Error("RAZORPAY_ID and RAZORPAY_KEY must be defined in environment variables");
}

// Initialize razorpay object
const razorpay = new Razorpay({
  key_id: RAZORPAY_ID,
  key_secret: RAZORPAY_KEY,
});

// Subscription plan data
const subscriptionPlans = {
  student_plan: {
    type: "Student",
    price: 999, // in paise (Rs.999)
    credits: {
      videos: 25,
      images: 500,
      text: "Unlimited",
    }
  },
  teacher_plan: {
    type: "Teacher",
    price: 999, // in paise (Rs.1999)
    credits: {
      videos: 50,
      images: 500,
      text: "Unlimited",
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    const { planId } = await request.json();
    const payment_capture = 1;

    // Get plan details
    const plan = subscriptionPlans[planId as keyof typeof subscriptionPlans];
    
    if (!plan) {
      return new Response(JSON.stringify({ error: "Invalid subscription plan" }), {
        status: 400,
      });
    }

    const amount = plan.price;
    const currency = "INR";
    const options = {
      amount: amount.toString(),
      currency,
      receipt: shortidGenerate(),
      payment_capture,
      notes: {
        planId: planId,
        planType: plan.type,
        userId: "user_id_here",
        subscription_id: "sub_Q3795vK12jCO5m" // Added subscription ID
      },
    };

    const order = await razorpay.orders.create(options);
    return new Response(JSON.stringify(order), { status: 200 });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return new Response(JSON.stringify({ error: "Failed to create order" }), {
      status: 500,
    });
  }
}
