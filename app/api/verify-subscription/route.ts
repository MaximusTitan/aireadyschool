import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil",
});

// Helper function for safe date conversion
function safeToISOString(timestamp: number | null): string | null {
  if (!timestamp) return null;
  
  try {
    return new Date(timestamp * 1000).toISOString();
  } catch (error) {
    console.error(`Invalid timestamp value: ${timestamp}`, error);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID is required" },
      { status: 400 }
    );
  }

  try {
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });

    // Get the Supabase client
    const supabase = await createClient();

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Get the subscription details
    const subscription = session.subscription as Stripe.Subscription;
    
    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found in the session" },
        { status: 400 }
      );
    }

    // Get the price details
    const priceId = subscription.items.data[0].price.id;
    const price = subscription.items.data[0].price;
    
    // Determine if user is in trial
    const isTrialing = subscription.status === 'trialing';
    
    // Safely convert timestamps to ISO strings
    const trialStart = safeToISOString(subscription.trial_start);
    const trialEnd = safeToISOString(subscription.trial_end);
    const currentPeriodStart = safeToISOString((subscription as any).current_period_start);
    const currentPeriodEnd = safeToISOString((subscription as any).current_period_end);
    
    console.log("Subscription timestamps:", {
      trial_start: subscription.trial_start,
      trial_end: subscription.trial_end,
      current_period_start: (subscription as any).current_period_start,
      current_period_end: (subscription as any).current_period_end,
    });
    
    // Save the subscription details to our database
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        email: user.email || '',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        trial_start: trialStart,
        trial_end: trialEnd,
        is_trial_used: isTrialing,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        price_id: priceId,
        plan_name: "Creator", // Hardcoded for now, you might want to fetch this from metadata
        amount: (price.unit_amount || 0) / 100, // Convert from cents to dollars
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (updateError) {
      console.error("Error updating subscription in database:", updateError);
    }

    // Add user_subscription_id to the subscription object for the frontend
    const subscriptionWithUserId = {
      ...subscription,
      user_id: user.id
    };

    return NextResponse.json({
      success: true,
      subscription: subscriptionWithUserId,
    });
  } catch (error) {
    console.error("Error verifying subscription:", error);
    return NextResponse.json(
      { error: "Failed to verify subscription" },
      { status: 500 }
    );
  }
}
