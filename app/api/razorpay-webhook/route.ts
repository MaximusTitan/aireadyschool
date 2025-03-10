import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Webhook secret removed since we're no longer verifying signatures
export async function POST(req: NextRequest) {
  try {
    // Get the raw body as text
    const rawBody = await req.text();
    
    // Parse the body content as JSON directly without verification
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
    const amount = payload.amount || 0;
    
    // Handle different subscription events
    switch (event.event) {
      case 'subscription.authenticated':
        // Subscription was authenticated - ensure record exists
        await ensureSubscriptionRecord(supabase, subscriptionId, userId, notes);
        console.log("Subscription authenticated:", subscriptionId);
        break;
        
      case 'subscription.activated':
        // Subscription is now active
        await updateSubscriptionStatus(supabase, subscriptionId, "active");
        console.log("Subscription activated:", subscriptionId);
        break;
        
      case 'subscription.charged':
      case 'subscription.payment.succeeded':
        // Payment was successful - ensure subscription is active and record payment
        await updateSubscriptionStatus(supabase, subscriptionId, "active");
        await recordPayment(
          supabase,
          userId,
          subscriptionId,
          paymentId,
          amount,
          "completed"
        );
        console.log("Payment successful for subscription:", subscriptionId);
        break;
        
      case 'subscription.pending':
        // Payment is pending
        await updateSubscriptionStatus(supabase, subscriptionId, "pending");
        console.log("Subscription pending:", subscriptionId);
        break;
        
      case 'subscription.halted':
        // Subscription was halted due to payment failures
        await updateSubscriptionStatus(supabase, subscriptionId, "halted");
        console.log("Subscription halted:", subscriptionId);
        break;
        
      case 'subscription.cancelled':
        // Subscription was cancelled
        await updateSubscriptionStatus(supabase, subscriptionId, "cancelled");
        console.log("Subscription cancelled:", subscriptionId);
        break;
        
      case 'payment.failed':
        // Payment failed
        await recordPayment(
          supabase,
          userId,
          subscriptionId,
          paymentId,
          amount,
          "failed"
        );
        console.log("Payment failed for subscription:", subscriptionId);
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

// Helper function to ensure subscription record exists
async function ensureSubscriptionRecord(
  supabase: any,
  razorpaySubscriptionId: string,
  userId: string,
  notes: any
) {
  try {
    // Check if record already exists
    const { data: existingSubscription } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("razorpay_subscription_id", razorpaySubscriptionId)
      .maybeSingle();
    
    // If exists, no need to create
    if (existingSubscription) return existingSubscription;
    
    // Otherwise create new record
    const planId = notes.planId || "student_plan"; // Default to student plan if not specified
    
    const { data, error } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        plan_id: planId,
        razorpay_subscription_id: razorpaySubscriptionId,
        status: "pending",
        meta_data: {
          createdFromWebhook: true,
          userEmail: notes.userEmail,
          userRole: notes.userRole,
          notes: notes
        }
      })
      .select()
      .single();
      
    if (error) {
      console.error("Error creating subscription record from webhook:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Failed to ensure subscription record:", error);
    throw error;
  }
}

// Helper function to update subscription status
async function updateSubscriptionStatus(
  supabase: any, 
  razorpaySubscriptionId: string, 
  status: string
) {
  try {
    // First check if subscription exists
    const { data: existingSubscription } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("razorpay_subscription_id", razorpaySubscriptionId)
      .maybeSingle();
    
    // If no record exists, we can't update
    if (!existingSubscription) {
      console.log(`No subscription found with ID ${razorpaySubscriptionId} to update status`);
      return null;
    }
    
    // Update the subscription
    const { data, error } = await supabase
      .from("user_subscriptions")
      .update({ 
        status, 
        updated_at: new Date().toISOString(),
        meta_data: {
          ...existingSubscription.meta_data,
          lastStatusUpdate: new Date().toISOString(),
          lastStatus: existingSubscription.status,
          currentStatus: status
        }
      })
      .eq("razorpay_subscription_id", razorpaySubscriptionId)
      .select();
      
    if (error) {
      console.error("Error updating subscription status:", error);
      throw error;
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
      .eq("razorpay_subscription_id", subscriptionId)
      .maybeSingle();
      
    if (subscriptionError) {
      console.error("Error finding subscription:", subscriptionError);
      return { error: subscriptionError };
    }
    
    if (!subscriptionData) {
      console.error("No subscription found with ID:", subscriptionId);
      return { error: "Subscription not found" };
    }
    
    // Check if payment already recorded to avoid duplicates
    const { data: existingPayment } = await supabase
      .from("payment_history")
      .select("*")
      .eq("payment_id", paymentId)
      .maybeSingle();
    
    if (existingPayment) {
      console.log("Payment already recorded:", paymentId);
      return { data: existingPayment };
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
