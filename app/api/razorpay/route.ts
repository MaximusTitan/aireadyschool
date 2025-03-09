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

// Define IMap type from Razorpay SDK
interface IMap<T> {
  [key: string]: T | null;
}

// Define Razorpay order options type explicitly matching Razorpay's expected types
interface RazorpayOrderOptions {
  amount: number;
  currency: string;
  receipt?: string;
  notes?: IMap<string | number>;
  payment_capture?: 0 | 1;
}

// Define RazorpayOrder interface
interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, any>;
  created_at: number;
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
    const { planId, subscriptionId } = await request.json();
    const payment_capture = 1;

    // Get plan details
    const plan = subscriptionPlans[planId as keyof typeof subscriptionPlans];
    
    if (!plan) {
      return new Response(JSON.stringify({ error: "Invalid subscription plan" }), {
        status: 400,
      });
    }

    if (!subscriptionId) {
      return new Response(JSON.stringify({ error: "Subscription ID is required" }), {
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

    // Safely access user metadata
    const userMetadata = user.user_metadata || {};
    const userRole = userMetadata.role || "Unknown";

    const amount = plan.price;
    const currency = "INR";
    
    // Create notes object with proper typing
    const notes: IMap<string | number> = {
      planId: planId,
      planType: plan.type,
      userId: user.id,
      userEmail: user.email || "",
      userRole: userRole,
      subscription_id: subscriptionId
    };
    
    // Create order options with proper typing
    const options: RazorpayOrderOptions = {
      amount: Number(amount),
      currency,
      receipt: shortidGenerate(),
      payment_capture,
      notes
    };

    // Create order with proper type casting
    const order = await razorpay.orders.create(options as any) as unknown as RazorpayOrder;

    // Update the subscription record to include order information
    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update({
        razorpay_order_id: order.id,
        meta_data: {
          userEmail: user.email,
          userRole: userRole,
          razorpay_order: order
        }
      })
      .eq("razorpay_subscription_id", subscriptionId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating subscription with order info:", updateError);
      // Continue even if update fails - webhook will handle this
    }

    return new Response(JSON.stringify(order), { status: 200 });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return new Response(JSON.stringify({ error: "Failed to create order" }), {
      status: 500,
    });
  }
}
