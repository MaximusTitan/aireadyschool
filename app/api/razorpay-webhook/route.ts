import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Webhook secret removed since we're no longer verifying signatures
export async function POST(req: NextRequest) {
  try {
    // Get the raw body as text
    const rawBody = await req.text();
    
    // Parse the body content as JSON directly without verification
    const event = JSON.parse(rawBody);
    
    // Log the received webhook payload for debugging
    console.log('Received Razorpay webhook:', JSON.stringify(event, null, 2));
    
    // Initialize Supabase client
    const supabase = await createClient();
    
    // Extract data based on event type and structure
    // The payload structure varies depending on the event type
    let payload;
    let paymentData;
    
    if (event.payload?.subscription?.entity) {
      payload = event.payload.subscription.entity;
    } else if (event.payload?.payment?.entity) {
      paymentData = event.payload.payment.entity;
      payload = event.payload.subscription?.entity || {};
    } else if (event.payload?.entity) {
      payload = event.payload.entity;
    } else {
      console.error("Unrecognized payload structure:", event);
      return new Response(JSON.stringify({ error: "Invalid payload structure" }), { status: 400 });
    }
    
    // Extract subscription or payment information with fallbacks
    const paymentId = paymentData?.id || payload.payment_id || payload.id;
    const subscriptionId = payload.id;
    
    // Extract notes - they can be in different locations depending on the event
    const notes = payload.notes || {};
    
    // Log extracted info
    console.log("Extracted data:", { 
      event: event.event,
      paymentId, 
      subscriptionId,
      notes,
      status: payload.status 
    });
    
    // Safely extract user ID from notes
    const userId = notes.userId || notes.user_id;
    
    // For certain events, userId is required
    const userIdRequiredEvents = [
      'subscription.authenticated', 
      'subscription.charged',
      'subscription.payment.succeeded'
    ];
    
    if (!userId && userIdRequiredEvents.includes(event.event)) {
      console.error("Missing userId in webhook payload notes:", notes);
      return new Response(JSON.stringify({ error: "Missing userId in notes" }), { status: 400 });
    }
    
    // Extract amount - can be in different locations
    const amount = parseFloat(paymentData?.amount || payload.amount) || 0;
    
    // Handle different subscription events
    switch (event.event) {
      case 'subscription.authenticated':
        if (!subscriptionId || !userId) {
          console.error("Missing required fields for subscription.authenticated", { subscriptionId, userId });
          return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }
        // Subscription was authenticated - ensure record exists
        await ensureSubscriptionRecord(supabase, subscriptionId, userId, notes);
        console.log("Subscription authenticated:", subscriptionId);
        break;
        
      case 'subscription.activated':
        if (!subscriptionId) {
          console.error("Missing subscriptionId for subscription.activated");
          return new Response(JSON.stringify({ error: "Missing subscriptionId" }), { status: 400 });
        }
        // Subscription is now active
        await updateSubscriptionStatus(supabase, subscriptionId, "active");
        console.log("Subscription activated:", subscriptionId);
        break;
        
      case 'subscription.charged':
        if (!subscriptionId || !paymentId) {
          console.error("Missing required fields for subscription.charged", { subscriptionId, paymentId });
          return new Response(JSON.stringify({ error: "Missing required payment fields" }), { status: 400 });
        }
        
        // For subscription.charged, the userId might be in the payment entity
        const paymentUserId = userId || paymentData?.customer_id;
        
        if (!paymentUserId) {
          console.error("Missing userId for payment tracking");
          return new Response(JSON.stringify({ error: "Missing userId for payment" }), { status: 400 });
        }
        
        // Payment was successful - ensure subscription is active and record payment
        await updateSubscriptionStatus(supabase, subscriptionId, "active");
        await recordPayment(
          supabase,
          paymentUserId,
          subscriptionId,
          paymentId,
          amount,
          "completed"
        );
        console.log("Payment successful for subscription:", subscriptionId);
        break;
        
      case 'subscription.payment.succeeded':
        if (!subscriptionId || !paymentId || !userId) {
          console.error("Missing required fields for payment tracking", { subscriptionId, paymentId, userId });
          return new Response(JSON.stringify({ error: "Missing required payment fields" }), { status: 400 });
        }
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
        if (!subscriptionId) {
          console.error("Missing subscriptionId for subscription.pending");
          return new Response(JSON.stringify({ error: "Missing subscriptionId" }), { status: 400 });
        }
        // Payment is pending
        await updateSubscriptionStatus(supabase, subscriptionId, "pending");
        console.log("Subscription pending:", subscriptionId);
        break;
        
      case 'subscription.halted':
        if (!subscriptionId) {
          console.error("Missing subscriptionId for subscription.halted");
          return new Response(JSON.stringify({ error: "Missing subscriptionId" }), { status: 400 });
        }
        // Subscription was halted due to payment failures
        await updateSubscriptionStatus(supabase, subscriptionId, "halted");
        console.log("Subscription halted:", subscriptionId);
        break;
        
      case 'subscription.cancelled':
        if (!subscriptionId) {
          console.error("Missing subscriptionId for subscription.cancelled");
          return new Response(JSON.stringify({ error: "Missing subscriptionId" }), { status: 400 });
        }
        // Subscription was cancelled
        await updateSubscriptionStatus(supabase, subscriptionId, "cancelled");
        console.log("Subscription cancelled:", subscriptionId);
        break;
        
      case 'subscription.paused':
        if (!subscriptionId) {
          console.error("Missing subscriptionId for subscription.paused");
          return new Response(JSON.stringify({ error: "Missing subscriptionId" }), { status: 400 });
        }
        // Subscription was paused - map to 'halted' status in our system
        await updateSubscriptionStatus(supabase, subscriptionId, "halted");
        console.log("Subscription paused:", subscriptionId);
        break;
        
      case 'subscription.resumed':
        if (!subscriptionId) {
          console.error("Missing subscriptionId for subscription.resumed");
          return new Response(JSON.stringify({ error: "Missing subscriptionId" }), { status: 400 });
        }
        // Subscription was resumed - map to 'active' status in our system
        await updateSubscriptionStatus(supabase, subscriptionId, "active");
        console.log("Subscription resumed:", subscriptionId);
        break;
        
      case 'subscription.completed':
        if (!subscriptionId) {
          console.error("Missing subscriptionId for subscription.completed");
          return new Response(JSON.stringify({ error: "Missing subscriptionId" }), { status: 400 });
        }
        // Subscription was completed - map to 'expired' status in our system
        await updateSubscriptionStatus(supabase, subscriptionId, "expired");
        console.log("Subscription completed:", subscriptionId);
        break;
        
      case 'payment.failed':
        // For failed payments, we need at least the payment ID
        if (!paymentId) {
          console.error("Missing paymentId for payment.failed");
          return new Response(JSON.stringify({ error: "Missing paymentId" }), { status: 400 });
        }
        
        const failedPaymentUserId = userId || paymentData?.customer_id;
        if (!failedPaymentUserId) {
          console.error("Missing userId for payment.failed");
          return new Response(JSON.stringify({ error: "Missing userId for payment" }), { status: 400 });
        }
        
        // Payment failed
        await recordPayment(
          supabase,
          failedPaymentUserId,
          subscriptionId, // May be undefined for one-time payments
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
    // Validate required parameters
    if (!razorpaySubscriptionId || !userId) {
      throw new Error(`Missing required parameters: subscriptionId=${razorpaySubscriptionId}, userId=${userId}`);
    }

    // Check if record already exists
    const { data: existingSubscription } = await supabase
      .from("user_subscriptions_rzp")
      .select("*")
      .eq("razorpay_subscription_id", razorpaySubscriptionId)
      .maybeSingle();
    
    // If exists, no need to create
    if (existingSubscription) return existingSubscription;
    
    // Otherwise create new record
    const planId = notes.planId || "student_plan"; // Default to student plan if not specified
    
    const { data, error } = await supabase
      .from("user_subscriptions_rzp")
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
    // Validate required parameter
    if (!razorpaySubscriptionId) {
      throw new Error(`Cannot update subscription status: missing subscriptionId`);
    }

    // First check if subscription exists
    const { data: existingSubscription } = await supabase
      .from("user_subscriptions_rzp")
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
      .from("user_subscriptions_rzp")
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
  subscriptionId: string | undefined,
  paymentId: string,
  amount: number,
  status: string
) {
  try {
    // Validate required parameters
    if (!userId || !paymentId) {
      console.error("Missing required payment parameters", { userId, paymentId });
      throw new Error("Missing required payment parameters");
    }

    let subscriptionRecordId = null;

    // Only look up the subscription if we have a subscription ID
    if (subscriptionId) {
      // Get the subscription record from the database
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("user_subscriptions_rzp")
        .select("id")
        .eq("razorpay_subscription_id", subscriptionId)
        .maybeSingle();
        
      if (subscriptionError) {
        console.error("Error finding subscription:", subscriptionError);
      } else if (subscriptionData) {
        subscriptionRecordId = subscriptionData.id;
      } else {
        console.log("No subscription found with ID:", subscriptionId);
      }
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
        subscription_id: subscriptionRecordId, // May be null for one-time payments
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
