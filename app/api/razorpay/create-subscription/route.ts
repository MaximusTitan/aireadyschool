import Razorpay from "razorpay";
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

// Define plan IDs for each subscription type
// These should match your plan IDs created in Razorpay dashboard
const PLAN_MAP = {
  student_plan: "plan_Q4Bm4WMwzPSZbX",
  teacher_plan: "plan_teacher_aiready",
};

// Define interface for Razorpay subscription creation
interface RazorpaySubscriptionCreateParams {
  plan_id: string;
  total_count: number;
  quantity: number;
  customer_notify: 0 | 1 | boolean; // Updated to match Razorpay's expected types
  notes?: Record<string, string>;
  [key: string]: any; // For any other properties that might be needed
}

export async function POST(request: NextRequest) {
  try {
    const { planId } = await request.json();
    
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

    // Get the corresponding Razorpay plan ID
    const razorpayPlanId = PLAN_MAP[planId as keyof typeof PLAN_MAP];
    
    if (!razorpayPlanId) {
      return new Response(JSON.stringify({ error: "Invalid plan ID" }), {
        status: 400,
      });
    }

    // Calculate current timestamp and expiry (1 month later)
    const now = Math.floor(Date.now() / 1000);
    const oneMonthLater = now + (30 * 24 * 60 * 60);

    // Create subscription payload with proper typing
    const subscriptionPayload: RazorpaySubscriptionCreateParams = {
      plan_id: razorpayPlanId,
      total_count: 12, // 12 billing cycles (1 year)
      quantity: 1,
      customer_notify: 1, // Use 1 instead of true to match Razorpay's expected format
      notes: {
        userId: user.id,
        userEmail: user.email || "",
        userRole: userRole,
        planId: planId
      }
    };

    // Create subscription in Razorpay
    const subscription = await razorpay.subscriptions.create(subscriptionPayload);

    // Create a pending subscription record in the database
    const { data: dbSubscription, error: dbError } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: user.id,
        plan_id: planId,
        razorpay_subscription_id: subscription.id,
        status: "pending",
        meta_data: {
          userEmail: user.email,
          userRole: userRole,
          razorpay_data: subscription
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error creating subscription record:", dbError);
      // Continue with the response even if DB insert fails
      // The webhook handler will attempt to create it if missing
    }
    
    return new Response(JSON.stringify({ subscription }), { status: 200 });
  } catch (error: any) {
    console.error("Error creating Razorpay subscription:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to create subscription", 
        details: error.message 
      }), 
      { status: 500 }
    );
  }
}
