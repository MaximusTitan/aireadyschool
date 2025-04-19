import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil",
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    
    // Get the user's subscription details
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();
    
    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }
    
    // Fix for customer ID issue - ensure it's a proper string, not a JSON object or string
    let customerId = subscription.stripe_customer_id;
    
    // Handle if the customer ID is a JSON string
    if (customerId.startsWith('{') && customerId.endsWith('}')) {
      try {
        // Try to parse it as JSON
        const customerObj = JSON.parse(customerId);
        if (customerObj && customerObj.id) {
          customerId = customerObj.id;
        }
      } catch (parseError) {
        console.error("Error parsing customer ID:", parseError);
      }
    }
    
    console.log("Using customer ID:", customerId);
    
    // Create a Stripe customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment`,
    });
    
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating customer portal:", error);
    return NextResponse.json(
      { error: "Failed to create customer portal" },
      { status: 500 }
    );
  }
}
