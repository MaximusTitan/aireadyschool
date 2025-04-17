import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil",
});

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
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
    
    // Save the subscription details to our database
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        email: user.email || '',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: trialEnd?.toISOString(),
        is_trial_used: isTrialing,
        // Fixed: safely accessing period timestamps with type assertion
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
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
