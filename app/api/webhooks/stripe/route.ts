import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil",
});

// This is your Stripe webhook secret for testing with Stripe CLI (https://stripe.com/docs/stripe-cli)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.log(`⚠️  Webhook signature verification failed:`, errorMessage);
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  // Create a Supabase client - use server client to bypass auth
  const supabase = createClient();

  // Handle the event
  try {
    console.log(`Processing webhook: ${event.type}`);
    
    switch (event.type) {
      case "customer.subscription.created":
        console.log("Subscription created event received");
        const createdSubscription = event.data.object as Stripe.Subscription;
        await processSubscriptionChange(createdSubscription, supabase);
        break;
        
      case "customer.subscription.updated":
        console.log("Subscription updated event received");
        const updatedSubscription = event.data.object as Stripe.Subscription;
        await processSubscriptionChange(updatedSubscription, supabase);
        break;
        
      case "customer.subscription.deleted":
        console.log("Subscription deleted event received");
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await cancelSubscription(deletedSubscription, supabase);
        break;
        
      case "invoice.payment_succeeded":
        console.log("Invoice payment succeeded event received");
        const successInvoice = event.data.object as Stripe.Invoice;
        await handleSuccessfulPayment(successInvoice, supabase);
        break;
        
      case "invoice.payment_failed":
        console.log("Invoice payment failed event received");
        const failedInvoice = event.data.object as Stripe.Invoice;
        await handleFailedPayment(failedInvoice, supabase);
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return NextResponse.json(
      { error: "Error processing webhook" },
      { status: 500 }
    );
  }
}

// Combined function to handle subscription creation and updates
async function processSubscriptionChange(subscription: Stripe.Subscription, supabase: any) {
  // Get customer ID from the subscription
  const customerId = subscription.customer as string;
  
  try {
    // Get customer details to find email
    const customer = await stripe.customers.retrieve(customerId);
    const customerEmail = typeof customer !== 'string' && !customer.deleted ? customer.email : null;
    
    // First, try to find user by customer ID
    let { data: users } = await supabase
      .from('user_subscriptions')
      .select('user_id, email')
      .eq('stripe_customer_id', customerId);
    
    // If no user found by customer ID, try to find by email
    if (!users || users.length === 0) {
      if (customerEmail) {
        // Find user by email in auth.users
        const { data: authUsers } = await supabase
          .auth.admin.listUsers();

        const userWithEmail = authUsers?.users?.find((u: { email: string; }) => u.email === customerEmail);
        
        if (userWithEmail) {
          // Create a new subscription record
          users = [{ user_id: userWithEmail.id, email: customerEmail }];
        } else {
          console.log("No user found with email:", customerEmail);
          return;
        }
      } else {
        console.log("No user found with customer ID and no email available:", customerId);
        return;
      }
    }
    
    const userId = users[0].user_id;
    const email = users[0].email || customerEmail;

    // Get price details from the subscription
    const priceId = subscription.items.data[0].price.id;
    const price = await stripe.prices.retrieve(priceId);
    const productId = typeof price.product === 'string' ? price.product : price.product.id;
    const product = await stripe.products.retrieve(productId);
    
    // Update subscription in the database
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        email: email,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        is_trial_used: subscription.status === 'trialing',
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        price_id: priceId,
        plan_name: product.name || "Creator",
        amount: (price.unit_amount || 0) / 100, // Convert from cents to dollars
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error("Error updating subscription:", error);
    } else {
      console.log(`Subscription ${subscription.status} for user ${userId} updated successfully`);
    }
  } catch (error) {
    console.error("Error in processSubscriptionChange:", error);
  }
}

async function cancelSubscription(subscription: Stripe.Subscription, supabase: any) {
  await supabase
    .from('user_subscriptions')
    .update({
      subscription_status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleSuccessfulPayment(invoice: Stripe.Invoice, supabase: any) {
  const subscriptionId = (invoice as any).subscription as string;
  
  if (subscriptionId) {
    // Fetch the subscription to get the latest status
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // Update status in database
      await supabase
        .from('user_subscriptions')
        .update({
          subscription_status: subscription.status,
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId);
        
      console.log(`Payment succeeded for subscription ${subscriptionId}`);
    } catch (error) {
      console.error("Error handling successful payment:", error);
    }
  }
}

async function handleFailedPayment(invoice: Stripe.Invoice, supabase: any) {
  const subscriptionId = (invoice as any).subscription as string;
  
  if (subscriptionId) {
    await supabase
      .from('user_subscriptions')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId);
  }
}
