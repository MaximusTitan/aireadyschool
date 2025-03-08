import { NextRequest } from "next/server";
import crypto from "crypto";
import { createClient } from "@/utils/supabase/server";

// Webhook secret should be set in your Razorpay Dashboard and added to your environment variables
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "your_webhook_secret";

// Helper function to verify Razorpay webhook signature
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  
  // Fix the type error by comparing strings directly instead of using timingSafeEqual with Buffer
  return expectedSignature === signature;
}

export async function POST(req: NextRequest) {
  try {
    // Get the raw body as text for signature verification
    const rawBody = await req.text();
    
    // Get the signature from headers
    const signature = req.headers.get("x-razorpay-signature");
    
    if (!signature) {
      console.error("No Razorpay signature found in request headers");
      return new Response(JSON.stringify({ error: "No signature found" }), { 
        status: 400 
      });
    }
    
    // Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET);
    
    if (!isValid) {
      console.error("Invalid Razorpay webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), { 
        status: 401 
      });
    }
    
    // Parse the body content as JSON
    const event = JSON.parse(rawBody);
    
    // Initialize Supabase client
    const supabase = await createClient();
    
    // Get payload data
    const payload = event.payload.subscription || event.payload.payment;
    if (!payload) {
      return new Response(JSON.stringify({ error: "Invalid payload structure" }), { 
        status: 400 
      });
    }
    
    // Extract subscription or payment information
    const paymentId = payload.payment_id || payload.id;
    const subscriptionId = payload.subscription_id || payload.entity_id;
    const notes = payload.notes || {};
    const userId = notes.userId;
    
    // Handle different subscription events
    switch (event.event) {
      case 'subscription.authenticated':
        // Subscription was authenticated - no action needed
        console.log("Subscription authenticated:", subscriptionId);
        break;
        
      case 'subscription.activated':
        // Subscription is now active
        await updateSubscriptionStatus(supabase, subscriptionId, "active");
        break;
        
      case 'subscription.charged':
        // Payment was successful
        await recordPayment(
          supabase,
          userId,
          subscriptionId,
          paymentId,
          payload.amount,
          "completed"
        );
        break;
        
      case 'subscription.pending':
        // Payment is pending
        await updateSubscriptionStatus(supabase, subscriptionId, "pending");
        break;
        
      case 'subscription.halted':
        // Subscription was halted due to payment failures
        await updateSubscriptionStatus(supabase, subscriptionId, "halted");
        break;
        
      case 'subscription.cancelled':
        // Subscription was cancelled
        await updateSubscriptionStatus(supabase, subscriptionId, "cancelled");
        break;
        
      case 'payment.failed':
        // Payment failed
        await recordPayment(
          supabase,
          userId,
          subscriptionId,
          paymentId,
          payload.amount,
          "failed"
        );
        break;
        
      default:
        console.log('Unhandled Razorpay event:', event.event);
    }
    
    return new Response(JSON.stringify({ received: true }), { 
      status: 200 
    });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return new Response(JSON.stringify({ error: "Webhook handler failed" }), { 
      status: 500 
    });
  }
}

// Helper function to update subscription status
async function updateSubscriptionStatus(
  supabase: any, 
  razorpayOrderId: string, 
  status: string
) {
  try {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("razorpay_order_id", razorpayOrderId);
      
    if (error) {
      console.error("Error updating subscription status:", error);
    }
    
    return data;
  } catch (error) {
    console.error("Failed to update subscription status:", error);
    throw error;
  }
}

// Helper function to record payment
async function recordPayment(
  supabase: any,
  userId: string,
  subscriptionId: string,
  paymentId: string,
  amount: number,
  status: string
) {
  try {
    // Validate required parameters
    if (!userId || !subscriptionId || !paymentId) {
      console.error("Missing required payment parameters", { userId, subscriptionId, paymentId });
      return { error: "Missing required payment parameters" };
    }

    // First get the subscription record from the database
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("razorpay_order_id", subscriptionId)
      .single();
      
    if (subscriptionError) {
      console.error("Error finding subscription:", subscriptionError);
      return { error: subscriptionError };
    }
    
    if (!subscriptionData) {
      console.error("No subscription found with ID:", subscriptionId);
      return { error: "Subscription not found" };
    }
    
    // Record the payment in payment_history
    const { data, error } = await supabase
      .from("payment_history")
      .insert({
        user_id: userId,
        subscription_id: subscriptionData.id,
        payment_id: paymentId,
        amount,
        currency: "INR",
        status,
        payment_method: "razorpay",
        payment_date: new Date().toISOString()
      });
      
    if (error) {
      console.error("Error recording payment:", error);
      return { error };
    }
    
    return { data };
  } catch (error) {
    console.error("Failed to record payment:", error);
    throw error;
  }
}
