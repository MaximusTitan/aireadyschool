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

export async function POST(request: NextRequest) {
  try {
    // Get subscription ID from request
    const { subscriptionId } = await request.json();
    
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

    // Verify user owns this subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("razorpay_subscription_id", subscriptionId)
      .eq("user_id", user.id)
      .single();
    
    if (subscriptionError || !subscription) {
      return new Response(JSON.stringify({ error: "Subscription not found or you do not have permission to cancel it" }), {
        status: 403,
      });
    }

    // Call Razorpay API to cancel subscription
    const cancelledSubscription = await razorpay.subscriptions.cancel(subscriptionId);

    // Update subscription record in database
    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
        meta_data: {
          ...subscription.meta_data,
          cancelled_at: new Date().toISOString(),
          cancellation_reason: "user_requested",
          razorpay_cancellation_response: cancelledSubscription
        }
      })
      .eq("razorpay_subscription_id", subscriptionId);

    if (updateError) {
      console.error("Error updating subscription:", updateError);
      // Continue anyway as webhook will eventually update the subscription
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Subscription cancelled successfully"
    }), { status: 200 });
    
  } catch (error: any) {
    console.error("Error cancelling subscription:", error);
    
    // Handle Razorpay specific errors
    if (error.error && error.error.description) {
      return new Response(JSON.stringify({ 
        error: error.error.description 
      }), { status: 400 });
    }
    
    return new Response(JSON.stringify({ 
      error: "Failed to cancel subscription", 
      details: error.message 
    }), { status: 500 });
  }
}
