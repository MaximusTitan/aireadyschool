import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { createClient } from "@/utils/supabase/server";

const RAZORPAY_SECRET = process.env.RAZORPAY_TEST_KEY;

if (!RAZORPAY_SECRET) {
  throw new Error("RAZORPAY_TEST_KEY must be defined in environment variables");
}

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      planId
    } = await request.json();

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_SECRET as string)
      .update(body)
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return new Response(JSON.stringify({ error: "Invalid payment signature" }), {
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

    // Get subscription plan details
    const { data: planDetails, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !planDetails) {
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404,
      });
    }

    // Calculate subscription period (one month from now)
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // Insert subscription record
    const { data: subscription, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: user.id,
        plan_id: planId,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        status: "active",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        meta_data: {
          userEmail: user.email,
          userRole: user.user_metadata.role,
        }
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error("Error creating subscription:", subscriptionError);
      return new Response(JSON.stringify({ error: "Failed to create subscription" }), {
        status: 500,
      });
    }

    // Insert payment record
    const { error: paymentError } = await supabase
      .from("payment_history")
      .insert({
        user_id: user.id,
        subscription_id: subscription.id,
        payment_id: razorpay_payment_id,
        amount: planDetails.price,
        currency: "INR",
        status: "completed",
        payment_method: "razorpay",
        payment_date: new Date().toISOString()
      });

    if (paymentError) {
      console.error("Error recording payment:", paymentError);
      // Continue even if payment recording fails, since subscription is created
    }

    return new Response(JSON.stringify({
      success: true,
      subscription
    }), { status: 200 });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(JSON.stringify({ error: "Failed to verify payment" }), {
      status: 500,
    });
  }
}
