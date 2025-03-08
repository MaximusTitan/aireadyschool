import Razorpay from "razorpay";
import { generate as shortidGenerate } from "shortid";
import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Check if environment variables are defined
const RAZORPAY_TEST_ID = process.env.RAZORPAY_TEST_ID;
const RAZORPAY_TEST_KEY = process.env.RAZORPAY_TEST_KEY;

if (!RAZORPAY_TEST_ID || !RAZORPAY_TEST_KEY) {
  throw new Error("RAZORPAY_TEST_ID and RAZORPAY_TEST_KEY must be defined in environment variables");
}

// Initialize razorpay object
const razorpay = new Razorpay({
  key_id: RAZORPAY_TEST_ID,
  key_secret: RAZORPAY_TEST_KEY,
});

// Define Razorpay order options type explicitly
interface RazorpayOrderOptions {
  amount: number | string;
  currency: string;
  receipt?: string;
  notes?: Record<string, string | number | boolean | undefined>;
  payment_capture?: 0 | 1;
  [key: string]: any; // For any other properties that might be needed
}

// Subscription plan data
const subscriptionPlans = {
  student_plan: {
    type: "Student",
    price: 99900,
    credits: {
      videos: 25,
      images: 500,
      text: "Unlimited",
    }
  },
  teacher_plan: {
    type: "Teacher",
    price: 199900,
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

    // Get user info from Supabase auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        status: 401,
      });
    }

    const amount = plan.price;
    const currency = "INR";
    
    // Create order options with proper typing
    const options: RazorpayOrderOptions = {
      amount: amount.toString(),
      currency,
      receipt: shortidGenerate(),
      payment_capture,
      notes: {
        planId: planId,
        planType: plan.type,
        userId: user.id,
        userEmail: user.email || "",
        userRole: user.user_metadata.role || "Unknown",
        subscription_id: "sub_Q4Bs57xSJdZvOY"
      },
    };

    // @ts-ignore - Razorpay types might not align perfectly, but this works with their API
    const order = await razorpay.orders.create(options);
    return new Response(JSON.stringify(order), { status: 200 });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return new Response(JSON.stringify({ error: "Failed to create order" }), {
      status: 500,
    });
  }
}
