import { createClient } from "@/utils/supabase/client";

export type SubscriptionStatus = {
  isSubscribed: boolean;
  isTrialing: boolean;
  isPastDue: boolean;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  planName: string | null;
};

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  // Default status (not subscribed)
  const defaultStatus: SubscriptionStatus = {
    isSubscribed: false,
    isTrialing: false,
    isPastDue: false,
    trialEndsAt: null,
    currentPeriodEnd: null,
    planName: null
  };

  try {
    const supabase = createClient();
    
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return defaultStatus;
    }
    
    // Get subscription data for the user
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    if (error || !subscription) {
      return defaultStatus;
    }
    
    // Check subscription status
    const isActive = subscription.subscription_status === 'active';
    const isTrialing = subscription.subscription_status === 'trialing';
    const isPastDue = subscription.subscription_status === 'past_due';
    
    return {
      isSubscribed: isActive,
      isTrialing: isTrialing,
      isPastDue: isPastDue,
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end) : null,
      currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end) : null,
      planName: subscription.plan_name
    };
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return defaultStatus;
  }
}

// Function to check if user's subscription has access to a feature
export async function hasSubscriptionAccess(): Promise<boolean> {
  const status = await getSubscriptionStatus();
  return status.isSubscribed || status.isTrialing;
}

// Check if subscription is about to expire (within 7 days)
export function isSubscriptionExpiringSoon(currentPeriodEnd: Date | null): boolean {
  if (!currentPeriodEnd) return false;
  
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);
  
  return currentPeriodEnd <= sevenDaysFromNow;
}
